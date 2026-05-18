import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class DeleteTodoStatusUseCase {
  constructor(
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async execute(id: Uuid, userId: Uuid): Promise<void> {
    const status = await this.todoStatusRepository.findOwnedWithTodos(
      id,
      userId,
    );

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }
    await this.projectAccessService.assertCanWrite(status.projectId, userId);

    if (status.todos && status.todos.length > 0) {
      throw new ValidationException(ErrorCode.E101);
    }

    await this.todoStatusRepository.softDelete(id);
  }
}
