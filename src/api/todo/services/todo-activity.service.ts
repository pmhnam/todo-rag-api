import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoActivityRepository } from '../repositories/todo-activity.repository';

@Injectable()
export class TodoActivityService {
  private readonly logger = new Logger(TodoActivityService.name);

  constructor(
    private readonly todoActivityRepository: TodoActivityRepository,
  ) {}

  record(params: {
    todoId: Uuid;
    userId: Uuid;
    type: TodoActivityType;
    message: string;
    metadata?: Record<string, any>;
  }): void {
    const activity = this.todoActivityRepository.create({
      todoId: params.todoId,
      userId: params.userId,
      type: params.type,
      message: params.message,
      metadata: params.metadata,
      createdBy: params.userId,
      updatedBy: params.userId,
    });
    this.todoActivityRepository
      .save(activity)
      .catch((err) =>
        this.logger.warn(
          `Failed to record activity for todo ${params.todoId}: ${err.message}`,
        ),
      );
  }
}
