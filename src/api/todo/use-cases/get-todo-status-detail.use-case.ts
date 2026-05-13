import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class GetTodoStatusDetailUseCase {
  constructor(private readonly todoStatusRepository: TodoStatusRepository) {}

  async execute(id: Uuid, userId: Uuid): Promise<TodoStatusResDto> {
    const status = await this.todoStatusRepository.findOwnedById(id, userId);

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }

    return plainToInstance(TodoStatusResDto, status);
  }
}
