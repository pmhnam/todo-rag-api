import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RagConversationEntity } from '../entities/rag-conversation.entity';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { RagConversationRepository } from '../repositories/rag-conversation.repository';
import { RagMessageRepository } from '../repositories/rag-message.repository';
import { RagContextChunk } from '../types/rag.types';

@Injectable()
export class RagConversationService {
  constructor(
    private readonly conversationRepository: RagConversationRepository,
    private readonly messageRepository: RagMessageRepository,
  ) {}

  createConversation(
    userId: Uuid,
    title?: string,
  ): Promise<RagConversationEntity> {
    const conversation = this.conversationRepository.create({
      userId,
      title,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.conversationRepository.save(conversation);
  }

  getConversations(userId: Uuid): Promise<RagConversationEntity[]> {
    return this.conversationRepository.findManyOwned(userId);
  }

  async getConversation(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagConversationEntity> {
    const conversation = await this.conversationRepository.findOwnedById(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return conversation;
  }

  async getMessages(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagMessageEntity[]> {
    await this.getConversation(conversationId, userId);
    return this.messageRepository.findConversationMessages(conversationId);
  }

  getRecentMessages(
    conversationId: Uuid,
    take: number,
  ): Promise<RagMessageEntity[]> {
    return this.messageRepository.findRecentConversationMessages(
      conversationId,
      take,
    );
  }

  async deleteConversation(conversationId: Uuid, userId: Uuid): Promise<void> {
    const conversation = await this.getConversation(conversationId, userId);
    await this.conversationRepository.remove(conversation);
  }

  async saveMessagePair(params: {
    conversationId: Uuid;
    userMessage: string;
    assistantMessage: string;
    contextChunks: RagContextChunk[];
  }): Promise<void> {
    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: params.conversationId,
        role: 'user',
        content: params.userMessage,
        contextChunks: params.contextChunks,
      }),
    );

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: params.conversationId,
        role: 'assistant',
        content: params.assistantMessage,
      }),
    );
  }

  async setTitleIfEmpty(params: {
    conversation: RagConversationEntity;
    title: string;
    userId: Uuid;
  }): Promise<void> {
    if (params.conversation.title) return;

    params.conversation.title = params.title.slice(0, 100);
    params.conversation.updatedBy = params.userId;
    await this.conversationRepository.save(params.conversation);
  }
}
