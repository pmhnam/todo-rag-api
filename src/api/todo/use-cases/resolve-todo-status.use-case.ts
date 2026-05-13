import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable } from '@nestjs/common';
import { TodoStatusEntity } from '../entities/todo-status.entity';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class ResolveTodoStatusUseCase {
  constructor(private readonly todoStatusRepository: TodoStatusRepository) {}

  async byId(
    statusId: Uuid,
    userId: Uuid,
    projectId: Uuid,
  ): Promise<TodoStatusEntity> {
    const status = await this.todoStatusRepository.findOwnedInProject(
      statusId,
      userId,
      projectId,
    );

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    return status;
  }

  async byName(
    userId: Uuid,
    projectId: Uuid,
    statusName?: string,
  ): Promise<TodoStatusEntity> {
    if (!statusName) {
      throw new Error('Cần statusId hoặc statusName để xác định cột task.');
    }

    const statuses = await this.todoStatusRepository.findByNameInProject(
      userId,
      projectId,
      statusName,
    );

    if (statuses.length === 0) {
      throw new Error(
        `Không tìm thấy status "${statusName}" trong project hiện tại.`,
      );
    }

    if (statuses.length > 1) {
      throw new Error(
        `Tìm thấy nhiều status khớp "${statusName}": ${statuses
          .map((status) => `${status.name} (${status.id})`)
          .join(', ')}.`,
      );
    }

    return statuses[0];
  }
}
