import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateTodoStatusReqDto } from '../dto/create-todo-status.req.dto';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class CreateTodoStatusUseCase {
  constructor(private readonly todoStatusRepository: TodoStatusRepository) {}

  async execute(
    userId: Uuid,
    reqDto: CreateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    const status = this.todoStatusRepository.create({
      ...reqDto,
      projectId: reqDto.projectId as Uuid,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    return plainToInstance(
      TodoStatusResDto,
      await this.todoStatusRepository.save(status),
    );
  }
}
