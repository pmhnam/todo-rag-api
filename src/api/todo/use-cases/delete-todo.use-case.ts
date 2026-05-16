import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { TodoIndexingService } from '../services/todo-indexing.service';

@Injectable()
export class DeleteTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoIndexingService: TodoIndexingService,
    private readonly todoActivityService: TodoActivityService,
  ) {}

  async execute(id: Uuid, userId: Uuid): Promise<void> {
    const todo = await this.todoRepository.findOwnedById(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    this.todoActivityService.record({
      todoId: todo.id,
      userId,
      type: TodoActivityType.TASK_DELETED,
      message: `Deleted task "${todo.title}"`,
    });
    await this.todoRepository.softDelete(id);
    this.todoIndexingService.removeIndexAsync(id);
  }
}
