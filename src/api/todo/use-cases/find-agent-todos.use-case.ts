import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { TodoEntity } from '../entities/todo.entity';
import { TodoPriority } from '../enums/todo-priority.enum';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class FindAgentTodosUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  execute(
    userId: Uuid,
    params: {
      projectId?: Uuid;
      query?: string;
      statusId?: Uuid;
      priority?: TodoPriority;
      assigneeId?: Uuid;
    },
  ): Promise<TodoEntity[]> {
    return this.todoRepository.findOwnedForAgent(userId, params);
  }
}
