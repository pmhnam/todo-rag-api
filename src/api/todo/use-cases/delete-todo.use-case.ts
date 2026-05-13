import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoIndexingService } from '../services/todo-indexing.service';

@Injectable()
export class DeleteTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoIndexingService: TodoIndexingService,
  ) {}

  async execute(id: Uuid, userId: Uuid): Promise<void> {
    const todo = await this.todoRepository.findOwnedById(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    await this.todoRepository.softDelete(id);
    this.todoIndexingService.removeIndexAsync(id);
  }
}
