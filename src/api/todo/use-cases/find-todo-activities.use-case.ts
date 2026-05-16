import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoActivityResDto } from '../dto/todo-activity.res.dto';
import { TodoActivityRepository } from '../repositories/todo-activity.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class FindTodoActivitiesUseCase {
  constructor(
    private readonly todoActivityRepository: TodoActivityRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
  ) {}

  async execute(todoId: Uuid, userId: Uuid): Promise<TodoActivityResDto[]> {
    await this.getTodoDetailUseCase.getEntity(todoId, userId);
    return plainToInstance(
      TodoActivityResDto,
      await this.todoActivityRepository.findManyByTodo(todoId),
    );
  }
}
