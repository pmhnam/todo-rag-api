import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class DeleteTodoCommentUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly todoActivityService: TodoActivityService,
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
    this.todoActivityService.record({
      todoId,
      userId,
      type: TodoActivityType.COMMENT_DELETED,
      message: 'Deleted a comment',
      metadata: { commentId },
    });
  }
}
