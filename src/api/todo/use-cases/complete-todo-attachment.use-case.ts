import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CompleteTodoAttachmentReqDto } from '../dto/complete-todo-attachment.req.dto';
import { TodoAttachmentResDto } from '../dto/todo-attachment.res.dto';
import { TodoAttachmentRepository } from '../repositories/todo-attachment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';
import { resolveAttachmentKind } from './presign-todo-attachment.use-case';

@Injectable()
export class CompleteTodoAttachmentUseCase {
  constructor(
    private readonly todoAttachmentRepository: TodoAttachmentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async execute(
    todoId: Uuid,
    userId: Uuid,
    reqDto: CompleteTodoAttachmentReqDto,
  ): Promise<TodoAttachmentResDto> {
    const todo = await this.getTodoDetailUseCase.getEntity(todoId, userId);
    await this.projectAccessService.assertCanWrite(todo.projectId, userId);

    if (!reqDto.key.startsWith(`todos/${todoId}/`)) {
      throw new BadRequestException('Invalid attachment key');
    }

    const kind = resolveAttachmentKind(reqDto.mimeType, reqDto.size);
    const attachment = this.todoAttachmentRepository.create({
      todoId,
      userId,
      commentId: reqDto.commentId as Uuid | undefined,
      kind,
      storageKey: reqDto.key,
      url: reqDto.url,
      originalName: reqDto.filename,
      mimeType: reqDto.mimeType,
      size: reqDto.size,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoAttachmentRepository.save(attachment);
    return plainToInstance(TodoAttachmentResDto, saved);
  }
}
