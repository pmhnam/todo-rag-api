import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ListTodoStatusReqDto } from '../dto/list-todo-status.req.dto';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class FindTodoStatusesUseCase {
  constructor(private readonly todoStatusRepository: TodoStatusRepository) {}

  async execute(
    userId: Uuid,
    reqDto: ListTodoStatusReqDto,
  ): Promise<OffsetPaginatedDto<TodoStatusResDto>> {
    const [statuses, metaDto] = await this.todoStatusRepository.findManyOwned(
      userId,
      reqDto,
    );

    return new OffsetPaginatedDto(
      plainToInstance(TodoStatusResDto, statuses),
      metaDto,
    );
  }
}
