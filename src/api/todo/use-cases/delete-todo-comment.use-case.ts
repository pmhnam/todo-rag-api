import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class DeleteTodoCommentUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
  ) {}

  async execute(todoId: Uuid, commentId: Uuid, userId: Uuid): Promise<void> {
    await this.getTodoDetailUseCase.getEntity(todoId, userId);
    const comment = await this.todoCommentRepository.findOwnedById(
      commentId,
      todoId,
      userId,
    );
    if (!comment) throw new NotFoundException('Comment not found');

    await this.todoCommentRepository.softDelete(commentId);
  }
}
