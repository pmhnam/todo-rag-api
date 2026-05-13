import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RagConversationEntity } from '../entities/rag-conversation.entity';

@Injectable()
export class RagConversationRepository {
  constructor(
    @InjectRepository(RagConversationEntity)
    private readonly repository: Repository<RagConversationEntity>,
  ) {}

  findOwnedById(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagConversationEntity | null> {
    return this.repository.findOne({ where: { id: conversationId, userId } });
  }

  findManyOwned(userId: Uuid): Promise<RagConversationEntity[]> {
    return this.repository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  create(data: Partial<RagConversationEntity>): RagConversationEntity {
    return this.repository.create(data);
  }

  save(conversation: RagConversationEntity): Promise<RagConversationEntity> {
    return this.repository.save(conversation);
  }

  async remove(conversation: RagConversationEntity): Promise<void> {
    await this.repository.remove(conversation);
  }
}
