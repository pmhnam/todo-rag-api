import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { TodoPriority } from '../enums/todo-priority.enum';
import { TodoRepository } from '../repositories/todo.repository';

export type CountTasksParams = {
  projectId?: Uuid;
  statusId?: Uuid;
  statusName?: string;
  priority?: TodoPriority;
  dueDate?: 'today' | 'overdue' | 'upcoming' | 'none';
  from?: Date;
  to?: Date;
  groupBy?: 'status' | 'priority' | 'dueDate' | 'project';
};

@Injectable()
export class CountTasksUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  execute(userId: Uuid, params: CountTasksParams = {}) {
    return this.todoRepository.countTasks(userId, params);
  }
}
