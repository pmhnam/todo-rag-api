import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListTodoStatusReqDto } from '../dto/list-todo-status.req.dto';
import { TodoStatusEntity } from '../entities/todo-status.entity';

@Injectable()
export class TodoStatusRepository {
  constructor(
    @InjectRepository(TodoStatusEntity)
    private readonly repository: Repository<TodoStatusEntity>,
  ) {}

  async findManyOwned(
    userId: Uuid,
    reqDto: ListTodoStatusReqDto,
  ): Promise<[TodoStatusEntity[], OffsetPaginationDto]> {
    const query = this.repository
      .createQueryBuilder('status')
      .leftJoin('status.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .leftJoin('project.workspace', 'workspace')
      .leftJoin(
        'workspace.members',
        'workspaceMember',
        'workspaceMember.user_id = :userId',
        { userId },
      )
      .where(
        '(project.user_id = :userId OR member.id IS NOT NULL OR workspace.owner_id = :userId OR workspaceMember.id IS NOT NULL)',
        { userId },
      )
      .andWhere('status.project_id = :projectId', {
        projectId: reqDto.projectId,
      })
      .orderBy('status.order', 'ASC')
      .addOrderBy('status.createdAt', 'ASC');

    return paginate<TodoStatusEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
  }

  findOwnedById(id: Uuid, userId: Uuid): Promise<TodoStatusEntity | null> {
    return this.createAccessibleStatusQuery(id, userId).getOne();
  }

  findOwnedWithTodos(id: Uuid, userId: Uuid): Promise<TodoStatusEntity | null> {
    return this.createAccessibleStatusQuery(id, userId)
      .leftJoinAndSelect('status.todos', 'todos')
      .getOne();
  }

  private createAccessibleStatusQuery(id: Uuid, userId: Uuid) {
    return this.repository
      .createQueryBuilder('status')
      .leftJoin('status.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .leftJoin('project.workspace', 'workspace')
      .leftJoin(
        'workspace.members',
        'workspaceMember',
        'workspaceMember.user_id = :userId',
        { userId },
      )
      .where('status.id = :id', { id })
      .andWhere(
        '(project.user_id = :userId OR member.id IS NOT NULL OR workspace.owner_id = :userId OR workspaceMember.id IS NOT NULL)',
        { userId },
      );
  }

  findOwnedInProject(
    id: Uuid,
    userId: Uuid,
    projectId: Uuid,
  ): Promise<TodoStatusEntity | null> {
    return this.repository.findOne({ where: { id, projectId } });
  }

  findByNameInProject(
    userId: Uuid,
    projectId: Uuid,
    name: string,
  ): Promise<TodoStatusEntity[]> {
    return this.repository
      .createQueryBuilder('status')
      .leftJoin('status.project', 'project')
      .leftJoin('project.members', 'member', 'member.user_id = :userId', {
        userId,
      })
      .leftJoin('project.workspace', 'workspace')
      .leftJoin(
        'workspace.members',
        'workspaceMember',
        'workspaceMember.user_id = :userId',
        { userId },
      )
      .where('status.project_id = :projectId', { projectId })
      .andWhere('status.name ILIKE :name', { name: `%${name}%` })
      .andWhere(
        '(project.user_id = :userId OR member.id IS NOT NULL OR workspace.owner_id = :userId OR workspaceMember.id IS NOT NULL)',
        { userId },
      )
      .orderBy('status.order', 'ASC')
      .take(5)
      .getMany();
  }

  create(data: Partial<TodoStatusEntity>): TodoStatusEntity {
    return this.repository.create(data);
  }

  save(
    status: TodoStatusEntity | TodoStatusEntity[],
  ): Promise<TodoStatusEntity | TodoStatusEntity[]> {
    return this.repository.save(status as TodoStatusEntity);
  }

  async softDelete(id: Uuid): Promise<void> {
    await this.repository.softDelete(id);
  }
}
