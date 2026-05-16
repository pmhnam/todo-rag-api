import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ToolConfirmationDto } from '../dto/chat.req.dto';
import { RagConversationEntity } from '../entities/rag-conversation.entity';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { RagConversationRepository } from '../repositories/rag-conversation.repository';
import { RagMessageRepository } from '../repositories/rag-message.repository';
import { RagContextChunk } from '../types/rag.types';
import { RagPromptBuilderService } from './rag-prompt-builder.service';
import { SearchService } from './search.service';
import { TaskAgentService, TaskAgentToolCall } from './task-agent.service';
import { TaskIntentClassifierService } from './task-intent-classifier.service';

const OUT_OF_SCOPE_RESPONSE =
  'Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến Todo trong hệ thống này.';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly conversationRepository: RagConversationRepository,
    private readonly messageRepository: RagMessageRepository,
    private readonly searchService: SearchService,
    private readonly ragPromptBuilderService: RagPromptBuilderService,
    private readonly taskAgentService: TaskAgentService,
    private readonly taskIntentClassifierService: TaskIntentClassifierService,
  ) {}

  async query(
    userId: Uuid,
    conversationId: Uuid,
    userMessage: string,
    topK: number = 5,
    projectId?: Uuid,
    confirmation?: ToolConfirmationDto,
  ): Promise<{
    response: string;
    contextChunks: RagContextChunk[];
    toolCalls?: TaskAgentToolCall[];
    pendingConfirmation?: {
      toolName: string;
      input: unknown;
      message: string;
    };
  }> {
    const conversation = await this.getConversation(conversationId, userId);
    if (confirmation) {
      const agentResponse = await this.taskAgentService.confirmTool({
        userId,
        toolName: confirmation.approvedToolName,
        input: confirmation.approvedInput,
      });

      await this.saveMessagePair(
        conversationId,
        userMessage,
        agentResponse.text,
        [],
      );

      return {
        response: agentResponse.text,
        contextChunks: [],
        toolCalls: agentResponse.toolCalls,
      };
    }

    const intent = this.taskIntentClassifierService.classify(userMessage);
    if (intent === 'OUT_OF_SCOPE') {
      await this.saveMessagePair(
        conversationId,
        userMessage,
        OUT_OF_SCOPE_RESPONSE,
        [],
      );

      return {
        response: OUT_OF_SCOPE_RESPONSE,
        contextChunks: [],
        toolCalls: [],
      };
    }

    const searchResults = await this.searchService.search(
      userId,
      userMessage,
      topK,
    );
    const context = this.ragPromptBuilderService.buildContext(searchResults);
    const contextChunks =
      this.ragPromptBuilderService.buildContextChunks(searchResults);

    this.logger.debug(
      `RAG query: found ${searchResults.length} context chunks`,
    );

    const previousMessages =
      await this.messageRepository.findRecentConversationMessages(
        conversationId,
        20,
      );

    const agentResponse = await this.taskAgentService.chat({
      userId,
      userMessage,
      previousMessages,
      projectId,
      ragContext: context,
    });

    await this.saveMessagePair(
      conversationId,
      userMessage,
      agentResponse.text,
      contextChunks,
    );

    if (previousMessages.length === 0 && !conversation.title) {
      conversation.title = userMessage.slice(0, 100);
      conversation.updatedBy = userId;
      await this.conversationRepository.save(conversation);
    }

    return {
      response: agentResponse.text,
      contextChunks,
      toolCalls: agentResponse.toolCalls,
      pendingConfirmation: agentResponse.pendingConfirmation,
    };
  }

  search(userId: Uuid, query: string, topK: number = 5) {
    return this.searchService.search(userId, query, topK);
  }

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

  async deleteConversation(conversationId: Uuid, userId: Uuid): Promise<void> {
    const conversation = await this.getConversation(conversationId, userId);
    await this.conversationRepository.remove(conversation);
  }

  private async saveMessagePair(
    conversationId: Uuid,
    userMessage: string,
    assistantMessage: string,
    contextChunks: RagContextChunk[],
  ): Promise<void> {
    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId,
        role: 'user',
        content: userMessage,
        contextChunks,
      }),
    );

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId,
        role: 'assistant',
        content: assistantMessage,
      }),
    );
  }
}
