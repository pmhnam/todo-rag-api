import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoActivityEntity } from '../entities/todo-activity.entity';

@Injectable()
export class TodoActivityRepository {
  constructor(
    @InjectRepository(TodoActivityEntity)
    private readonly repository: Repository<TodoActivityEntity>,
  ) {}

  findManyByTodo(todoId: Uuid): Promise<TodoActivityEntity[]> {
    return this.repository.find({
      where: { todoId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  create(data: Partial<TodoActivityEntity>): TodoActivityEntity {
    return this.repository.create(data);
  }

  save(activity: TodoActivityEntity): Promise<TodoActivityEntity> {
    return this.repository.save(activity);
  }
}
