import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoResDto } from '../dto/todo.res.dto';
import { TodoEntity } from '../entities/todo.entity';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class GetTodoDetailUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    return plainToInstance(TodoResDto, await this.getEntity(id, userId));
  }

  async getEntity(id: Uuid, userId: Uuid): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    return todo;
  }
}
