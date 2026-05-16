import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { TodoEntity } from '../entities/todo.entity';
import { TodoPriority } from '../enums/todo-priority.enum';

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

    query.orderBy('todo.position', 'ASC').addOrderBy('todo.createdAt', 'ASC');

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

  findOwnedForAgent(
    userId: Uuid,
    params: {
      projectId?: Uuid;
      query?: string;
      statusId?: Uuid;
      priority?: TodoPriority;
    },
  ): Promise<TodoEntity[]> {
    const query = this.repository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId })
      .orderBy('todo.updatedAt', 'DESC')
      .take(10);

    if (params.projectId) {
      query.andWhere('todo.project_id = :projectId', {
        projectId: params.projectId,
      });
    }

    if (params.query) {
      query.andWhere('todo.title ILIKE :q', { q: `%${params.query}%` });
    }

    if (params.statusId) {
      query.andWhere('todo.status_id = :statusId', {
        statusId: params.statusId,
      });
    }

    if (params.priority) {
      query.andWhere('todo.priority = :priority', {
        priority: params.priority,
      });
    }

    return query.getMany();
  }

  create(data: Partial<TodoEntity>): TodoEntity {
    return this.repository.create(data);
  }

  save(todo: TodoEntity): Promise<TodoEntity> {
    return this.repository.save(todo);
  }

  findOwnedByIds(ids: Uuid[], userId: Uuid): Promise<TodoEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repository.find({ where: { id: In(ids), userId } });
  }

  async getNextPosition(userId: Uuid, projectId: Uuid, statusId: Uuid) {
    const result = await this.repository
      .createQueryBuilder('todo')
      .select('COALESCE(MAX(todo.position), -1)', 'maxPosition')
      .where('todo.user_id = :userId', { userId })
      .andWhere('todo.project_id = :projectId', { projectId })
      .andWhere('todo.status_id = :statusId', { statusId })
      .getRawOne<{ maxPosition: string }>();

    return Number(result?.maxPosition ?? -1) + 1;
  }

  async saveMany(todos: TodoEntity[]): Promise<TodoEntity[]> {
    return this.repository.save(todos);
  }

  async softDelete(id: Uuid): Promise<void> {
    await this.repository.softDelete(id);
  }
}
