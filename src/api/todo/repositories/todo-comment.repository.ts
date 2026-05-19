import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoCommentEntity } from '../entities/todo-comment.entity';

@Injectable()
export class TodoCommentRepository {
  constructor(
    @InjectRepository(TodoCommentEntity)
    private readonly repository: Repository<TodoCommentEntity>,
  ) {}

  findManyByTodo(todoId: Uuid): Promise<TodoCommentEntity[]> {
    return this.repository.find({
      where: { todoId },
      relations: { attachments: true, user: true },
      order: { createdAt: 'ASC' },
    });
  }

  findOwnedById(
    id: Uuid,
    todoId: Uuid,
    userId: Uuid,
  ): Promise<TodoCommentEntity | null> {
    return this.repository.findOne({
      where: { id, todoId, userId },
      relations: { user: true, attachments: true },
    });
  }

  create(data: Partial<TodoCommentEntity>): TodoCommentEntity {
    return this.repository.create(data);
  }

  save(comment: TodoCommentEntity): Promise<TodoCommentEntity> {
    return this.repository.save(comment);
  }

  async softDelete(id: Uuid): Promise<void> {
    await this.repository.softDelete(id);
  }
}
