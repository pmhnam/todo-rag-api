import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoResDto } from '../dto/todo.res.dto';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { TodoIndexingService } from '../services/todo-indexing.service';

@Injectable()
export class ArchiveTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly projectAccessService: ProjectAccessService,
    private readonly todoActivityService: TodoActivityService,
    private readonly todoIndexingService: TodoIndexingService,
  ) {}

  async archive(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);
    if (!todo) throw new NotFoundException({ errorCode: ErrorCode.E110 });

    await this.projectAccessService.assertCanWrite(todo.projectId, userId);

    todo.archivedAt = new Date();
    todo.archivedBy = userId;
    todo.updatedBy = userId;
    const saved = await this.todoRepository.save(todo);

    this.todoActivityService.record({
      todoId: saved.id,
      userId,
      type: TodoActivityType.TASK_ARCHIVED,
      message: `Archived task "${saved.title}"`,
    });
    this.todoIndexingService.removeIndexAsync(saved.id);

    return plainToInstance(TodoResDto, saved);
  }

  async unarchive(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);
    if (!todo) throw new NotFoundException({ errorCode: ErrorCode.E110 });

    await this.projectAccessService.assertCanWrite(todo.projectId, userId);

    todo.archivedAt = null;
    todo.archivedBy = null;
    todo.updatedBy = userId;
    const saved = await this.todoRepository.save(todo);

    this.todoActivityService.record({
      todoId: saved.id,
      userId,
      type: TodoActivityType.TASK_UNARCHIVED,
      message: `Restored task "${saved.title}"`,
    });
    this.todoIndexingService.reindexAsync(userId, saved);

    return plainToInstance(TodoResDto, saved);
  }
}
