import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { paginate } from '@/utils/offset-pagination';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateTodoReqDto } from '../dto/create-todo.req.dto';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoStatusEntity } from '../entities/todo-status.entity';
import { TodoEntity } from '../entities/todo.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
  ) {}

  async findMany(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    const query = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId });

    if (reqDto.statusId) {
      query.andWhere('todo.status_id = :statusId', {
        statusId: reqDto.statusId,
      });
    }

    if (reqDto.priority) {
      query.andWhere('todo.priority = :priority', {
        priority: reqDto.priority,
      });
    }

    if (reqDto.jiraSyncStatus) {
      query.andWhere('todo.jira_sync_status = :jiraSyncStatus', {
        jiraSyncStatus: reqDto.jiraSyncStatus,
      });
    }

    if (reqDto.q) {
      query.andWhere('todo.title ILIKE :q', { q: `%${reqDto.q}%` });
    }

    query.orderBy('todo.createdAt', 'DESC');

    const [todos, metaDto] = await paginate<TodoEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(plainToInstance(TodoResDto, todos), metaDto);
  }

  async findOne(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    return plainToInstance(TodoResDto, todo);
  }

  async create(userId: Uuid, reqDto: CreateTodoReqDto): Promise<TodoResDto> {
    // Verify the status belongs to this user
    const status = await this.todoStatusRepository.findOne({
      where: { id: reqDto.statusId as Uuid, userId },
    });

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    const todo = this.todoRepository.create({
      ...reqDto,
      statusId: reqDto.statusId as Uuid,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoRepository.save(todo);
    return plainToInstance(TodoResDto, { ...saved, status });
  }

  async update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    // If statusId changes, verify the new status belongs to this user
    if (reqDto.statusId && reqDto.statusId !== todo.statusId) {
      const status = await this.todoStatusRepository.findOne({
        where: { id: reqDto.statusId as Uuid, userId },
      });

      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }

      todo.status = status;
    }

    Object.assign(todo, reqDto);
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);
    return plainToInstance(TodoResDto, saved);
  }

  async delete(id: Uuid, userId: Uuid): Promise<void> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    await this.todoRepository.softDelete(id);
  }
}
