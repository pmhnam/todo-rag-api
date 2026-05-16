import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateTodoCommentReqDto } from '../dto/create-todo-comment.req.dto';
import { TodoCommentResDto } from '../dto/todo-comment.res.dto';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class CreateTodoCommentUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
  ) {}

  async execute(
    todoId: Uuid,
    userId: Uuid,
    reqDto: CreateTodoCommentReqDto,
  ): Promise<TodoCommentResDto> {
    await this.getTodoDetailUseCase.getEntity(todoId, userId);
    const comment = this.todoCommentRepository.create({
      todoId,
      userId,
      content: reqDto.content.trim(),
      createdBy: userId,
      updatedBy: userId,
    });

    return plainToInstance(
      TodoCommentResDto,
      await this.todoCommentRepository.save(comment),
    );
  }
}
