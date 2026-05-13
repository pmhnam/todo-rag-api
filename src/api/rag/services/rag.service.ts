import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RagConversationEntity } from '../entities/rag-conversation.entity';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { SearchService } from './search.service';
import { TaskAgentService, TaskAgentToolCall } from './task-agent.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @InjectRepository(RagConversationEntity)
    private readonly conversationRepo: Repository<RagConversationEntity>,
    @InjectRepository(RagMessageEntity)
    private readonly messageRepo: Repository<RagMessageEntity>,
    private readonly searchService: SearchService,
    private readonly taskAgentService: TaskAgentService,
  ) {}

  /**
   * Full RAG pipeline: search context → build prompt → call LLM → save messages.
   */
  async query(
    userId: Uuid,
    conversationId: Uuid,
    userMessage: string,
    topK: number = 5,
    projectId?: Uuid,
  ): Promise<{
    response: string;
    contextChunks: any[];
    toolCalls?: TaskAgentToolCall[];
  }> {
    // 1. Verify conversation belongs to user
    const conversation = await this.getConversation(conversationId, userId);

    // 2. Search for relevant context
    const searchResults = await this.searchService.search(
      userId,
      userMessage,
      topK,
    );

    const context = this.searchService.buildContext(searchResults);
    const contextChunks = searchResults.map((r) => ({
      chunkId: r.chunkId,
      sourceId: r.sourceId,
      distance: r.distance,
      contentPreview: r.content.slice(0, 200),
    }));

    this.logger.debug(
      `RAG query: found ${searchResults.length} context chunks`,
    );

    // 3. Build conversation history
    const previousMessages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 20, // Last 20 messages for context window
    });

    // 4. Call task agent with AI SDK tool calling.
    const agentResponse = await this.taskAgentService.chat({
      userId,
      userMessage,
      previousMessages,
      projectId,
      ragContext: context,
    });

    // 6. Save user message
    await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'user',
        content: userMessage,
        contextChunks,
      }),
    );

    // 7. Save assistant response
    await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'assistant',
        content: agentResponse.text,
      }),
    );

    // 8. Update conversation title if first message
    if (previousMessages.length === 0 && !conversation.title) {
      conversation.title = userMessage.slice(0, 100);
      conversation.updatedBy = userId;
      await this.conversationRepo.save(conversation);
    }

    return {
      response: agentResponse.text,
      contextChunks,
      toolCalls: agentResponse.toolCalls,
    };
  }

  /**
   * Perform vector search without LLM generation.
   */
  async search(userId: Uuid, query: string, topK: number = 5) {
    return this.searchService.search(userId, query, topK);
  }

  /**
   * Create a new conversation.
   */
  async createConversation(
    userId: Uuid,
    title?: string,
  ): Promise<RagConversationEntity> {
    const conversation = this.conversationRepo.create({
      userId,
      title,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.conversationRepo.save(conversation);
  }

  /**
   * List user's conversations.
   */
  async getConversations(userId: Uuid): Promise<RagConversationEntity[]> {
    return this.conversationRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Get a conversation with validation.
   */
  async getConversation(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagConversationEntity> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return conversation;
  }

  /**
   * Get messages for a conversation.
   */
  async getMessages(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagMessageEntity[]> {
    // Verify ownership
    await this.getConversation(conversationId, userId);

    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Delete a conversation and all its messages.
   */
  async deleteConversation(conversationId: Uuid, userId: Uuid): Promise<void> {
    const conversation = await this.getConversation(conversationId, userId);
    await this.conversationRepo.remove(conversation);
  }
}
