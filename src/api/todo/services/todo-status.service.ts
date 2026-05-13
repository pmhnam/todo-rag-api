import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { paginate } from '@/utils/offset-pagination';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateTodoStatusReqDto } from '../dto/create-todo-status.req.dto';
import { ListTodoStatusReqDto } from '../dto/list-todo-status.req.dto';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { UpdateTodoStatusReqDto } from '../dto/update-todo-status.req.dto';
import { TodoStatusEntity } from '../entities/todo-status.entity';

// Default statuses auto-seeded for new users
export const DEFAULT_TODO_STATUSES = [
  { name: 'To Do', order: 0, color: '#6B7280' },
  { name: 'In Progress', order: 1, color: '#3B82F6' },
  { name: 'Done', order: 2, color: '#10B981' },
];

@Injectable()
export class TodoStatusService {
  constructor(
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
  ) {}

  /**
   * Seed default statuses for a project.
   */
  async seedDefaultStatuses(projectId: Uuid, userId: Uuid): Promise<void> {
    const statuses = DEFAULT_TODO_STATUSES.map((s) =>
      this.todoStatusRepository.create({
        ...s,
        userId,
        projectId,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      }),
    );
    await this.todoStatusRepository.save(statuses);
  }

  async findAll(
    userId: Uuid,
    reqDto: ListTodoStatusReqDto,
  ): Promise<OffsetPaginatedDto<TodoStatusResDto>> {
    const query = this.todoStatusRepository
      .createQueryBuilder('status')
      .where('status.user_id = :userId', { userId })
      .andWhere('status.project_id = :projectId', {
        projectId: reqDto.projectId,
      })
      .orderBy('status.order', 'ASC')
      .addOrderBy('status.createdAt', 'ASC');

    const [statuses, metaDto] = await paginate<TodoStatusEntity>(
      query,
      reqDto,
      {
        skipCount: false,
        takeAll: false,
      },
    );

    return new OffsetPaginatedDto(
      plainToInstance(TodoStatusResDto, statuses),
      metaDto,
    );
  }

  async findOne(id: Uuid, userId: Uuid): Promise<TodoStatusResDto> {
    const status = await this.todoStatusRepository.findOne({
      where: { id, userId },
    });

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }

    return plainToInstance(TodoStatusResDto, status);
  }

  async create(
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

    const saved = await this.todoStatusRepository.save(status);
    return plainToInstance(TodoStatusResDto, saved);
  }

  async update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    const status = await this.todoStatusRepository.findOne({
      where: { id, userId },
    });

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }

    Object.assign(status, reqDto);
    status.updatedBy = userId;

    const saved = await this.todoStatusRepository.save(status);
    return plainToInstance(TodoStatusResDto, saved);
  }

  async delete(id: Uuid, userId: Uuid): Promise<void> {
    const status = await this.todoStatusRepository.findOne({
      where: { id, userId },
      relations: ['todos'],
    });

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }

    // Block deletion if there are Todos using this status
    if (status.todos && status.todos.length > 0) {
      throw new ValidationException(ErrorCode.E101);
    }

    await this.todoStatusRepository.softDelete(id);
  }
}
