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
      .leftJoinAndSelect('todo.attachments', 'attachments')
      .leftJoin('todo.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .where('(project.user_id = :userId OR member.id IS NOT NULL)', { userId })
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
    return this.createAccessibleTodoQuery(id, userId).getOne();
  }

  findOwnedWithStatus(id: Uuid, userId: Uuid): Promise<TodoEntity | null> {
    return this.createAccessibleTodoQuery(id, userId)
      .leftJoinAndSelect('todo.status', 'detailStatus')
      .leftJoinAndSelect('todo.attachments', 'detailAttachments')
      .getOne();
  }

  private createAccessibleTodoQuery(id: Uuid, userId: Uuid) {
    return this.repository
      .createQueryBuilder('todo')
      .leftJoin('todo.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .where('todo.id = :id', { id })
      .andWhere('(project.user_id = :userId OR member.id IS NOT NULL)', {
        userId,
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
      .leftJoin('todo.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .where('(project.user_id = :userId OR member.id IS NOT NULL)', { userId })
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
      .leftJoin('todo.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .where('(project.user_id = :userId OR member.id IS NOT NULL)', {
        userId,
      });

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

  async countTasks(
    userId: Uuid,
    params: {
      projectId?: Uuid;
      statusId?: Uuid;
      statusName?: string;
      priority?: TodoPriority;
      dueDate?: 'today' | 'overdue' | 'upcoming' | 'none';
      from?: Date;
      to?: Date;
      groupBy?: 'status' | 'priority' | 'dueDate' | 'project';
    } = {},
  ): Promise<{
    total: number;
    groupBy?: string;
    groups?: Array<{ key: string; label?: string; count: number }>;
  }> {
    const query = this.repository
      .createQueryBuilder('todo')
      .leftJoin('todo.status', 'status')
      .leftJoin('todo.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .where('(project.user_id = :userId OR member.id IS NOT NULL)', {
        userId,
      });

    if (params.projectId) {
      query.andWhere('todo.project_id = :projectId', {
        projectId: params.projectId,
      });
    }

    if (params.statusId) {
      query.andWhere('todo.status_id = :statusId', {
        statusId: params.statusId,
      });
    }

    if (params.statusName) {
      query.andWhere('status.name ILIKE :statusName', {
        statusName: params.statusName,
      });
    }

    if (params.priority) {
      query.andWhere('todo.priority = :priority', {
        priority: params.priority,
      });
    }

    if (params.dueDate === 'today') {
      query.andWhere('todo.due_date = CURRENT_DATE');
    }

    if (params.dueDate === 'overdue') {
      query.andWhere('todo.due_date < CURRENT_DATE');
    }

    if (params.dueDate === 'upcoming') {
      query.andWhere('todo.due_date > CURRENT_DATE');
    }

    if (params.dueDate === 'none') {
      query.andWhere('todo.due_date IS NULL');
    }

    if (params.from) {
      query.andWhere('todo.due_date >= :from', { from: params.from });
    }

    if (params.to) {
      query.andWhere('todo.due_date <= :to', { to: params.to });
    }

    if (!params.groupBy) {
      return { total: await query.getCount() };
    }

    const groupConfig = {
      status: {
        key: 'todo.status_id',
        label: 'status.name',
      },
      priority: {
        key: 'todo.priority',
        label: 'todo.priority',
      },
      dueDate: {
        key: `CASE
          WHEN todo.due_date IS NULL THEN 'none'
          WHEN todo.due_date < CURRENT_DATE THEN 'overdue'
          WHEN todo.due_date = CURRENT_DATE THEN 'today'
          ELSE 'upcoming'
        END`,
        label: `CASE
          WHEN todo.due_date IS NULL THEN 'No due date'
          WHEN todo.due_date < CURRENT_DATE THEN 'Overdue'
          WHEN todo.due_date = CURRENT_DATE THEN 'Today'
          ELSE 'Upcoming'
        END`,
      },
      project: {
        key: 'todo.project_id',
        label: 'project.name',
      },
    }[params.groupBy];

    const rows = await query
      .clone()
      .select(groupConfig.key, 'key')
      .addSelect(groupConfig.label, 'label')
      .addSelect('COUNT(*)', 'count')
      .groupBy(groupConfig.key)
      .addGroupBy(groupConfig.label)
      .orderBy('count', 'DESC')
      .getRawMany<{ key: string; label?: string; count: string }>();

    return {
      total: rows.reduce((sum, row) => sum + Number(row.count), 0),
      groupBy: params.groupBy,
      groups: rows.map((row) => ({
        key: row.key,
        label: row.label,
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
    return this.repository.find({ where: { id: In(ids) } });
  }

  async getNextPosition(projectId: Uuid, statusId: Uuid) {
    const result = await this.repository
      .createQueryBuilder('todo')
      .select('COALESCE(MAX(todo.position), -1)', 'maxPosition')
      .where('todo.project_id = :projectId', { projectId })
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
