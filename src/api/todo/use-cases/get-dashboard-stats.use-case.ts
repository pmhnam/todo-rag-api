import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  execute(userId: Uuid, params: { projectId?: Uuid } = {}) {
    return this.todoRepository.getDashboardStats(userId, params);
  }
}
