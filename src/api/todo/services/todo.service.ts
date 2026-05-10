import { IndexingService } from '@/api/rag/services/indexing.service';
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
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoStatusEntity } from '../entities/todo-status.entity';
import { TodoEntity } from '../entities/todo.entity';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
    private readonly indexingService: IndexingService,
  ) {}

  async findMany(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    const query = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId });

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
    // Verify the status belongs to this user
    const status = await this.todoStatusRepository.findOne({
      where: { id: reqDto.statusId as Uuid, userId },
    });

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    const todo = this.todoRepository.create({
      ...reqDto,
      statusId: reqDto.statusId as Uuid,
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

    // If statusId changes, verify the new status belongs to this user
    if (reqDto.statusId && reqDto.statusId !== todo.statusId) {
      const status = await this.todoStatusRepository.findOne({
        where: { id: reqDto.statusId as Uuid, userId },
      });

      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }

      todo.status = status;
    }

    Object.assign(todo, reqDto);
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);

    // Auto-reindex for RAG (fire-and-forget)
    this.triggerReindex(userId, saved).catch((err) =>
      this.logger.warn(`Failed to reindex todo ${saved.id}: ${err.message}`),
    );

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
}
