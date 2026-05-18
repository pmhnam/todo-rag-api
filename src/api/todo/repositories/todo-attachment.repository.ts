import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TodoAttachmentEntity } from '../entities/todo-attachment.entity';

@Injectable()
export class TodoAttachmentRepository {
  constructor(
    @InjectRepository(TodoAttachmentEntity)
    private readonly repository: Repository<TodoAttachmentEntity>,
  ) {}

  create(data: Partial<TodoAttachmentEntity>): TodoAttachmentEntity {
    return this.repository.create(data);
  }

  save(attachment: TodoAttachmentEntity): Promise<TodoAttachmentEntity> {
    return this.repository.save(attachment);
  }

  findByTodo(todoId: Uuid): Promise<TodoAttachmentEntity[]> {
    return this.repository.find({
      where: { todoId },
      order: { createdAt: 'ASC' },
    });
  }

  findByCommentIds(commentIds: Uuid[]): Promise<TodoAttachmentEntity[]> {
    if (commentIds.length === 0) return Promise.resolve([]);
    return this.repository.find({
      where: { commentId: In(commentIds) },
      order: { createdAt: 'ASC' },
    });
  }

  findByStorageKeys(todoId: Uuid, userId: Uuid, keys: string[]) {
    if (keys.length === 0) return Promise.resolve([]);
    return this.repository.find({
      where: { todoId, userId, storageKey: In(keys) },
    });
  }

  async attachToComment(
    todoId: Uuid,
    userId: Uuid,
    keys: string[],
    commentId: Uuid,
  ): Promise<TodoAttachmentEntity[]> {
    const attachments = await this.findByStorageKeys(todoId, userId, keys);
    for (const attachment of attachments) {
      attachment.commentId = commentId;
      attachment.updatedBy = userId;
    }
    return this.repository.save(attachments);
  }

  findOwnedById(id: Uuid, todoId: Uuid, userId: Uuid) {
    return this.repository.findOne({ where: { id, todoId, userId } });
  }

  async softDelete(id: Uuid): Promise<void> {
    await this.repository.softDelete(id);
  }
}
