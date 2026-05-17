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
    const query = this.createOwnedProjectQuery(userId, reqDto);

    query.orderBy('todo.position', 'ASC').addOrderBy('todo.createdAt', 'ASC');

    return paginate<TodoEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
  }

  findBoardTodosOwned(userId: Uuid, reqDto: ListTodoReqDto) {
    return this.createOwnedProjectQuery(userId, reqDto)
      .orderBy('status.order', 'ASC')
      .addOrderBy('todo.position', 'ASC')
      .addOrderBy('todo.createdAt', 'ASC')
      .getMany();
  }

  private createOwnedProjectQuery(userId: Uuid, reqDto: ListTodoReqDto) {
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

    return query;
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

  async getDashboardStats(
    userId: Uuid,
    params: { projectId?: Uuid } = {},
  ): Promise<{
    total: number;
    overdue: number;
    dueToday: number;
    byPriority: Record<string, number>;
    byStatus: Array<{ statusId: Uuid; statusName: string; count: number }>;
  }> {
    const baseQuery = this.repository
      .createQueryBuilder('todo')
      .where('todo.user_id = :userId', { userId });

    if (params.projectId) {
      baseQuery.andWhere('todo.project_id = :projectId', {
        projectId: params.projectId,
      });
    }

    const total = await baseQuery.clone().getCount();
    const overdue = await baseQuery
      .clone()
      .andWhere('todo.due_date < CURRENT_DATE')
      .getCount();
    const dueToday = await baseQuery
      .clone()
      .andWhere('todo.due_date = CURRENT_DATE')
      .getCount();

    const priorityRows = await baseQuery
      .clone()
      .select('todo.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('todo.priority')
      .getRawMany<{ priority: string; count: string }>();

    const statusRows = await baseQuery
      .clone()
      .leftJoin('todo.status', 'status')
      .select('todo.status_id', 'statusId')
      .addSelect('status.name', 'statusName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('todo.status_id')
      .addGroupBy('status.name')
      .orderBy('status.name', 'ASC')
      .getRawMany<{ statusId: Uuid; statusName: string; count: string }>();

    return {
      total,
      overdue,
      dueToday,
      byPriority: Object.fromEntries(
        priorityRows.map((row) => [row.priority, Number(row.count)]),
      ),
      byStatus: statusRows.map((row) => ({
        statusId: row.statusId,
        statusName: row.statusName,
        count: Number(row.count),
      })),
    };
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
