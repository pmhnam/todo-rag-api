import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoStatusRepository } from '../repositories/todo-status.repository';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { TodoAiSummaryService } from '../services/todo-ai-summary.service';
import { TodoIndexingService } from '../services/todo-indexing.service';
import { TodoJiraSyncService } from '../services/todo-jira-sync.service';

@Injectable()
export class UpdateTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly todoAiSummaryService: TodoAiSummaryService,
    private readonly todoIndexingService: TodoIndexingService,
    private readonly todoJiraSyncService: TodoJiraSyncService,
    private readonly todoActivityService: TodoActivityService,
  ) {}

  async execute(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    const statusChanged = Boolean(
      reqDto.statusId && reqDto.statusId !== todo.statusId,
    );
    const before = {
      title: todo.title,
      description: todo.description,
      statusId: todo.statusId,
      statusName: todo.status?.name,
      priority: todo.priority,
      dueDate: todo.dueDate?.toISOString?.().slice(0, 10) ?? todo.dueDate,
      tags: todo.tags,
      aiSummary: todo.aiSummary,
      generatedByAi: todo.generatedByAi,
      externalLinks: todo.externalLinks,
    };

    if (statusChanged) {
      const status = await this.todoStatusRepository.findOwnedInProject(
        reqDto.statusId as Uuid,
        userId,
        todo.projectId,
      );

      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }

      todo.status = status;
    }

    let data = reqDto;
    if (!todo.aiSummary && !data.aiSummary) {
      const aiSummary = await this.todoAiSummaryService.generate(
        data.title ?? todo.title,
        data.description ?? todo.description,
      );

      if (aiSummary) {
        data = { ...data, aiSummary, generatedByAi: true };
      }
    }

    Object.assign(todo, data);
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);

    if (statusChanged) {
      await this.todoJiraSyncService.syncStatusAfterLocalMove(userId, saved);
      this.todoActivityService.record({
        todoId: saved.id,
        userId,
        type: TodoActivityType.TASK_MOVED,
        message: `Moved task from ${before.statusName || 'previous column'} to ${saved.status?.name || 'new column'}`,
        metadata: {
          fromStatusId: before.statusId,
          toStatusId: saved.statusId,
          fromStatus: before.statusName,
          toStatus: saved.status?.name,
        },
      });
    }

    const changes = this.buildChanges(before, saved);
    if (changes.length > 0) {
      this.todoActivityService.record({
        todoId: saved.id,
        userId,
        type: TodoActivityType.TASK_UPDATED,
        message: `Updated ${changes.map((change) => change.field).join(', ')}`,
        metadata: { changes },
      });
    }

    this.todoIndexingService.reindexAsync(userId, saved);

    return plainToInstance(TodoResDto, saved);
  }

  private buildChanges(before: Record<string, any>, todo: any) {
    const after = {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      dueDate: todo.dueDate?.toISOString?.().slice(0, 10) ?? todo.dueDate,
      tags: todo.tags,
      aiSummary: todo.aiSummary,
      generatedByAi: todo.generatedByAi,
      externalLinks: todo.externalLinks,
    };
    return Object.entries(after)
      .filter(
        ([field, value]) =>
          JSON.stringify(before[field]) !== JSON.stringify(value),
      )
      .map(([field, value]) => ({
        field,
        from: before[field] ?? null,
        to: value ?? null,
      }));
  }
}
