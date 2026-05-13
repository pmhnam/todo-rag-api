import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { Injectable } from '@nestjs/common';
import { CreateTodoStatusReqDto } from '../dto/create-todo-status.req.dto';
import { ListTodoStatusReqDto } from '../dto/list-todo-status.req.dto';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { UpdateTodoStatusReqDto } from '../dto/update-todo-status.req.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';
import { CreateTodoStatusUseCase } from '../use-cases/create-todo-status.use-case';
import { DeleteTodoStatusUseCase } from '../use-cases/delete-todo-status.use-case';
import { FindTodoStatusesUseCase } from '../use-cases/find-todo-statuses.use-case';
import { GetTodoStatusDetailUseCase } from '../use-cases/get-todo-status-detail.use-case';
import { UpdateTodoStatusUseCase } from '../use-cases/update-todo-status.use-case';

export const DEFAULT_TODO_STATUSES = [
  { name: 'To Do', order: 0, color: '#6B7280' },
  { name: 'In Progress', order: 1, color: '#3B82F6' },
  { name: 'Done', order: 2, color: '#10B981' },
];

@Injectable()
export class TodoStatusService {
  constructor(
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly findTodoStatusesUseCase: FindTodoStatusesUseCase,
    private readonly getTodoStatusDetailUseCase: GetTodoStatusDetailUseCase,
    private readonly createTodoStatusUseCase: CreateTodoStatusUseCase,
    private readonly updateTodoStatusUseCase: UpdateTodoStatusUseCase,
    private readonly deleteTodoStatusUseCase: DeleteTodoStatusUseCase,
  ) {}

  async seedDefaultStatuses(projectId: Uuid, userId: Uuid): Promise<void> {
    const statuses = DEFAULT_TODO_STATUSES.map((status) =>
      this.todoStatusRepository.create({
        ...status,
        userId,
        projectId,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      }),
    );
    await this.todoStatusRepository.save(statuses);
  }

  findAll(
    userId: Uuid,
    reqDto: ListTodoStatusReqDto,
  ): Promise<OffsetPaginatedDto<TodoStatusResDto>> {
    return this.findTodoStatusesUseCase.execute(userId, reqDto);
  }

  findOne(id: Uuid, userId: Uuid): Promise<TodoStatusResDto> {
    return this.getTodoStatusDetailUseCase.execute(id, userId);
  }

  create(
    userId: Uuid,
    reqDto: CreateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    return this.createTodoStatusUseCase.execute(userId, reqDto);
  }

  update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    return this.updateTodoStatusUseCase.execute(id, userId, reqDto);
  }

  delete(id: Uuid, userId: Uuid): Promise<void> {
    return this.deleteTodoStatusUseCase.execute(id, userId);
  }
}
