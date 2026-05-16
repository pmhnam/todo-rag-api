import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoCommentResDto } from '../dto/todo-comment.res.dto';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class FindTodoCommentsUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
  ) {}

  async execute(todoId: Uuid, userId: Uuid): Promise<TodoCommentResDto[]> {
    await this.getTodoDetailUseCase.getEntity(todoId, userId);
    const comments = await this.todoCommentRepository.findManyByTodo(todoId);
    return plainToInstance(TodoCommentResDto, comments);
  }
}
