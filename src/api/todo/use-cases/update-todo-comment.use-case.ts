import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoCommentResDto } from '../dto/todo-comment.res.dto';
import { UpdateTodoCommentReqDto } from '../dto/update-todo-comment.req.dto';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class UpdateTodoCommentUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
  ) {}

  async execute(
    todoId: Uuid,
    commentId: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoCommentReqDto,
  ): Promise<TodoCommentResDto> {
    await this.getTodoDetailUseCase.getEntity(todoId, userId);
    const comment = await this.todoCommentRepository.findOwnedById(
      commentId,
      todoId,
      userId,
    );
    if (!comment) throw new NotFoundException('Comment not found');

    if (reqDto.content !== undefined) {
      comment.content = reqDto.content.trim();
    }
    comment.updatedBy = userId;

    return plainToInstance(
      TodoCommentResDto,
      await this.todoCommentRepository.save(comment),
    );
  }
}
