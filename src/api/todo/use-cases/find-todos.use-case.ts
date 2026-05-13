import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class FindTodosUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    const [todos, metaDto] = await this.todoRepository.findManyOwned(
      userId,
      reqDto,
    );

    return new OffsetPaginatedDto(plainToInstance(TodoResDto, todos), metaDto);
  }
}
