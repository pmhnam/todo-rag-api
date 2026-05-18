import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateTodoCommentReqDto } from '../dto/create-todo-comment.req.dto';
import { TodoCommentResDto } from '../dto/todo-comment.res.dto';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoCommentRepository } from '../repositories/todo-comment.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class CreateTodoCommentUseCase {
  constructor(
    private readonly todoCommentRepository: TodoCommentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly todoActivityService: TodoActivityService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async execute(
    todoId: Uuid,
    userId: Uuid,
    reqDto: CreateTodoCommentReqDto,
  ): Promise<TodoCommentResDto> {
    const todo = await this.getTodoDetailUseCase.getEntity(todoId, userId);
    await this.projectAccessService.assertCanWrite(todo.projectId, userId);
    const comment = this.todoCommentRepository.create({
      todoId,
      userId,
      content: reqDto.content.trim(),
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoCommentRepository.save(comment);
    this.todoActivityService.record({
      todoId,
      userId,
      type: TodoActivityType.COMMENT_ADDED,
      message: 'Added a comment',
      metadata: { commentId: saved.id },
    });
    return plainToInstance(TodoCommentResDto, saved);
  }
}
