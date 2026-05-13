import { JiraIntegrationService } from '@/api/jira-integration/services/jira-integration.service';
import { IndexingService } from '@/api/rag/services/indexing.service';
import { LlmService } from '@/api/rag/services/llm.service';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { paginate } from '@/utils/offset-pagination';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { SourceType } from '../../rag/enums/source-type.enum';
import { CreateTodoReqDto } from '../dto/create-todo.req.dto';
import { LinkJiraIssueReqDto } from '../dto/link-jira-issue.req.dto';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoStatusEntity } from '../entities/todo-status.entity';
import { TodoEntity } from '../entities/todo.entity';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
    private readonly indexingService: IndexingService,
    private readonly llmService: LlmService,
    private readonly jiraIntegrationService: JiraIntegrationService,
  ) {}

  async findMany(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    const query = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId })
      .andWhere('todo.project_id = :projectId', {
        projectId: reqDto.projectId,
      });

    if (reqDto.statusId) {
      query.andWhere('todo.status_id = :statusId', {
        statusId: reqDto.statusId,
      });
    }

    if (reqDto.priority) {
      query.andWhere('todo.priority = :priority', {
        priority: reqDto.priority,
      });
    }

    if (reqDto.jiraSyncStatus) {
      query.andWhere('todo.jira_sync_status = :jiraSyncStatus', {
        jiraSyncStatus: reqDto.jiraSyncStatus,
      });
    }

    if (reqDto.q) {
      query.andWhere('todo.title ILIKE :q', { q: `%${reqDto.q}%` });
    }

    query.orderBy('todo.createdAt', 'DESC');

    const [todos, metaDto] = await paginate<TodoEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(plainToInstance(TodoResDto, todos), metaDto);
  }

  async findOne(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    return plainToInstance(TodoResDto, todo);
  }

  async create(userId: Uuid, reqDto: CreateTodoReqDto): Promise<TodoResDto> {
    // Verify the status belongs to this user and project
    const status = await this.todoStatusRepository.findOne({
      where: {
        id: reqDto.statusId as Uuid,
        projectId: reqDto.projectId as Uuid,
        userId,
      },
    });

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    if (!reqDto.aiSummary && reqDto.title && reqDto.description) {
      try {
        const prompt = `Bạn là một trợ lý ảo thông minh. Hãy tóm tắt ngắn gọn (trong khoảng 1-2 câu) mục tiêu của công việc sau. Tên công việc: "${reqDto.title}". Mô tả chi tiết: "${reqDto.description}". Trả về trực tiếp phần tóm tắt, không giải thích gì thêm.`;
        const res = await this.llmService.generate(prompt);
        if (res.content) {
          reqDto = {
            ...reqDto,
            aiSummary: res.content.trim(),
            generatedByAi: true,
          };
        }
      } catch (err) {
        this.logger.warn(
          `Failed to generate AI summary for todo: ${err.message}`,
        );
      }
    }

    const todo = this.todoRepository.create({
      ...reqDto,
      statusId: reqDto.statusId as Uuid,
      projectId: reqDto.projectId as Uuid,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoRepository.save(todo);

    // Auto-index for RAG (fire-and-forget)
    this.triggerReindex(userId, saved).catch((err) =>
      this.logger.warn(`Failed to index todo ${saved.id}: ${err.message}`),
    );

    return plainToInstance(TodoResDto, { ...saved, status });
  }

  async update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    const statusChanged = Boolean(
      reqDto.statusId && reqDto.statusId !== todo.statusId,
    );

    // If statusId changes, verify the new status belongs to this user and the same project
    if (reqDto.statusId && reqDto.statusId !== todo.statusId) {
      const status = await this.todoStatusRepository.findOne({
        where: {
          id: reqDto.statusId as Uuid,
          projectId: todo.projectId,
          userId,
        },
      });

      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }

      todo.status = status;
    }

    Object.assign(todo, reqDto);
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);

    if (statusChanged) {
      await this.syncJiraStatusAfterLocalMove(userId, saved);
    }

    // Auto-reindex for RAG (fire-and-forget)
    this.triggerReindex(userId, saved).catch((err) =>
      this.logger.warn(`Failed to reindex todo ${saved.id}: ${err.message}`),
    );

    return plainToInstance(TodoResDto, saved);
  }

  async linkJiraIssue(
    id: Uuid,
    userId: Uuid,
    reqDto: LinkJiraIssueReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    const jiraIssueKey = reqDto.jiraIssueKey?.trim().toUpperCase() || null;

    if (!jiraIssueKey) {
      todo.jiraIssueKey = null;
      todo.jiraIssueUrl = null;
      todo.jiraSyncStatus = JiraSyncStatus.NOT_LINKED;
      todo.jiraLastSyncedAt = null;
      todo.updatedBy = userId;

      const saved = await this.todoRepository.save(todo);
      return plainToInstance(TodoResDto, saved);
    }

    todo.jiraIssueKey = jiraIssueKey;
    todo.jiraIssueUrl = todo.projectId
      ? await this.jiraIntegrationService.buildIssueUrl(
          userId,
          todo.projectId,
          todo.jiraIssueKey,
        )
      : null;
    todo.jiraSyncStatus = todo.jiraIssueUrl
      ? JiraSyncStatus.SYNCED
      : JiraSyncStatus.NOT_LINKED;
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);
    return plainToInstance(TodoResDto, saved);
  }

  async delete(id: Uuid, userId: Uuid): Promise<void> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    await this.todoRepository.softDelete(id);

    // Remove RAG index (fire-and-forget)
    this.indexingService
      .removeIndex(SourceType.TODO, id)
      .catch((err) =>
        this.logger.warn(
          `Failed to remove index for todo ${id}: ${err.message}`,
        ),
      );
  }

  /**
   * Trigger RAG re-indexing for a todo.
   * Combines title + description as embeddable content.
   */
  private async triggerReindex(userId: Uuid, todo: TodoEntity): Promise<void> {
    const contentParts = [todo.title];
    if (todo.description) {
      contentParts.push(todo.description);
    }
    const content = contentParts.join('\n');

    await this.indexingService.reindexIfChanged(
      userId,
      SourceType.TODO,
      todo.id,
      content,
      {
        title: todo.title,
        priority: todo.priority,
        status: todo.status?.name,
      },
    );
  }

  private async syncJiraStatusAfterLocalMove(
    userId: Uuid,
    todo: TodoEntity,
  ): Promise<void> {
    try {
      const syncStatus =
        await this.jiraIntegrationService.syncTodoStatusTransition(
          userId,
          todo,
        );
      console.log('syncStatus', syncStatus);
      if (!syncStatus) return;

      todo.jiraSyncStatus = syncStatus;
      todo.jiraLastSyncedAt =
        syncStatus === JiraSyncStatus.SYNCED
          ? new Date()
          : todo.jiraLastSyncedAt;
      await this.todoRepository.save(todo);
    } catch (err) {
      todo.jiraSyncStatus = JiraSyncStatus.FAILED;
      await this.todoRepository.save(todo);
      this.logger.warn(
        `Failed to sync Jira transition for todo ${todo.id}: ${err.message}`,
      );
    }
  }
}
