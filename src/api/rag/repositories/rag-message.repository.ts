import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RagMessageEntity } from '../entities/rag-message.entity';

@Injectable()
export class RagMessageRepository {
  constructor(
    @InjectRepository(RagMessageEntity)
    private readonly repository: Repository<RagMessageEntity>,
  ) {}

  findConversationMessages(conversationId: Uuid): Promise<RagMessageEntity[]> {
    return this.repository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  findRecentConversationMessages(
    conversationId: Uuid,
    take: number,
  ): Promise<RagMessageEntity[]> {
    return this.repository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take,
    });
  }

  create(data: Partial<RagMessageEntity>): RagMessageEntity {
    return this.repository.create(data);
  }

  save(message: RagMessageEntity): Promise<RagMessageEntity> {
    return this.repository.save(message);
  }
}
