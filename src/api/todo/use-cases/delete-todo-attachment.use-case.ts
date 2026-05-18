import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoAttachmentRepository } from '../repositories/todo-attachment.repository';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

@Injectable()
export class DeleteTodoAttachmentUseCase {
  constructor(
    private readonly todoAttachmentRepository: TodoAttachmentRepository,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async execute(todoId: Uuid, attachmentId: Uuid, userId: Uuid): Promise<void> {
    const todo = await this.getTodoDetailUseCase.getEntity(todoId, userId);
    await this.projectAccessService.assertCanWrite(todo.projectId, userId);

    const attachment = await this.todoAttachmentRepository.findOwnedById(
      attachmentId,
      todoId,
      userId,
    );
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.todoAttachmentRepository.softDelete(attachmentId);
  }
}
