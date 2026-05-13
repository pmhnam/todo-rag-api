import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoEntity } from '../entities/todo.entity';

@Injectable()
export class TodoRepository {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly repository: Repository<TodoEntity>,
  ) {}

  async findManyOwned(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<[TodoEntity[], OffsetPaginationDto]> {
    const query = this.repository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId })
      .andWhere('todo.project_id = :projectId', {
        projectId: reqDto.projectId,
      });

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

    return paginate<TodoEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
  }

  findOwnedById(id: Uuid, userId: Uuid): Promise<TodoEntity | null> {
    return this.repository.findOne({ where: { id, userId } });
  }

  findOwnedWithStatus(id: Uuid, userId: Uuid): Promise<TodoEntity | null> {
    return this.repository.findOne({
      where: { id, userId },
      relations: ['status'],
    });
  }

  create(data: Partial<TodoEntity>): TodoEntity {
    return this.repository.create(data);
  }

  save(todo: TodoEntity): Promise<TodoEntity> {
    return this.repository.save(todo);
  }

  async softDelete(id: Uuid): Promise<void> {
    await this.repository.softDelete(id);
  }
}
