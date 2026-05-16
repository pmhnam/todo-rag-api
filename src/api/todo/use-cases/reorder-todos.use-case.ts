import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ReorderTodosReqDto } from '../dto/reorder-todos.req.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class ReorderTodosUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoStatusRepository: TodoStatusRepository,
  ) {}

  async execute(userId: Uuid, reqDto: ReorderTodosReqDto): Promise<void> {
    const projectId = reqDto.projectId as Uuid;
    const columns = reqDto.columns || [];
    const statusIds = columns.map((column) => column.statusId as Uuid);

    for (const statusId of statusIds) {
      const status = await this.todoStatusRepository.findOwnedInProject(
        statusId,
        userId,
        projectId,
      );
      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }
    }

    const todoIds = columns.flatMap((column) =>
      column.orderedTodoIds.map((id) => id as Uuid),
    );
    if (new Set(todoIds).size !== todoIds.length) {
      throw new BadRequestException('Duplicate todo IDs are invalid');
    }

    const todos = await this.todoRepository.findOwnedByIds(todoIds, userId);
    if (todos.length !== todoIds.length) {
      throw new BadRequestException('Some todos were not found');
    }

    const todoById = new Map(todos.map((todo) => [todo.id, todo]));
    for (const column of columns) {
      column.orderedTodoIds.forEach((todoId, position) => {
        const todo = todoById.get(todoId as Uuid);
        if (!todo || todo.projectId !== projectId) {
          throw new BadRequestException('Todos must belong to the project');
        }

        todo.statusId = column.statusId as Uuid;
        todo.position = position;
        todo.updatedBy = userId;
      });
    }

    await this.todoRepository.saveMany(todos);
  }
}
