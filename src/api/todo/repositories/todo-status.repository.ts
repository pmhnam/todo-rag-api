import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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
      .where('status.user_id = :userId', { userId })
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
    return this.repository.findOne({ where: { id, userId } });
  }

  findOwnedWithTodos(id: Uuid, userId: Uuid): Promise<TodoStatusEntity | null> {
    return this.repository.findOne({
      where: { id, userId },
      relations: ['todos'],
    });
  }

  findOwnedInProject(
    id: Uuid,
    userId: Uuid,
    projectId: Uuid,
  ): Promise<TodoStatusEntity | null> {
    return this.repository.findOne({ where: { id, userId, projectId } });
  }

  findByNameInProject(
    userId: Uuid,
    projectId: Uuid,
    name: string,
  ): Promise<TodoStatusEntity[]> {
    return this.repository.find({
      where: { userId, projectId, name: ILike(`%${name}%`) },
      take: 5,
      order: { order: 'ASC' },
    });
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
