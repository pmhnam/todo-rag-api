import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ToolConfirmationDto } from '../dto/chat.req.dto';
import { RagConversationEntity } from '../entities/rag-conversation.entity';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { AiIntent } from '../enums/ai-intent.enum';
import {
  OutputValidatorService,
  TODO_SCOPE_REFUSAL,
} from '../guard/output-validator.service';
import { RuleBasedGuardService } from '../guard/rule-based-guard.service';
import { IntentLoggingService } from '../intent/intent-logging.service';
import { IntentRouterService } from '../intent/intent-router.service';
import { LlmClassifierService } from '../intent/llm-classifier.service';
import { INTENT_TOOL_PERMISSIONS } from '../permission/intent-permissions';
import { RagConversationRepository } from '../repositories/rag-conversation.repository';
import { RagMessageRepository } from '../repositories/rag-message.repository';
import { IntentClassification } from '../types/intent-classification.type';
import { RagContextChunk } from '../types/rag.types';
import { RagPromptBuilderService } from './rag-prompt-builder.service';
import { SearchService } from './search.service';
import { TaskAgentService, TaskAgentToolCall } from './task-agent.service';

const AMBIGUOUS_RESPONSE =
  'Bạn muốn tôi thao tác gì trong hệ thống task/project? Ví dụ: tạo task, tìm task, đổi trạng thái, thêm comment, gắn tag hoặc xem dashboard.';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly conversationRepository: RagConversationRepository,
    private readonly messageRepository: RagMessageRepository,
    private readonly searchService: SearchService,
    private readonly ragPromptBuilderService: RagPromptBuilderService,
    private readonly taskAgentService: TaskAgentService,
    private readonly ruleBasedGuardService: RuleBasedGuardService,
    private readonly intentRouterService: IntentRouterService,
    private readonly llmClassifierService: LlmClassifierService,
    private readonly outputValidatorService: OutputValidatorService,
    private readonly intentLoggingService: IntentLoggingService,
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

    const classification = await this.classifyIntent(userMessage);

    if (classification.intent === AiIntent.OUT_OF_SCOPE) {
      await this.saveMessagePair(
        conversationId,
        userMessage,
        TODO_SCOPE_REFUSAL,
        [],
      );
      await this.intentLoggingService.log({
        userId,
        message: userMessage,
        classification,
        accepted: false,
      });

      return {
        response: TODO_SCOPE_REFUSAL,
        contextChunks: [],
        toolCalls: [],
      };
    }

    if (classification.intent === AiIntent.AMBIGUOUS) {
      await this.saveMessagePair(
        conversationId,
        userMessage,
        AMBIGUOUS_RESPONSE,
        [],
      );
      await this.intentLoggingService.log({
        userId,
        message: userMessage,
        classification,
        accepted: false,
      });

      return {
        response: AMBIGUOUS_RESPONSE,
        contextChunks: [],
        toolCalls: [],
      };
    }

    const allowedTools = INTENT_TOOL_PERMISSIONS[classification.intent];

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
      intent: classification.intent,
      allowedTools,
    });

    const safeAgentText = this.buildSafeAgentText(
      agentResponse,
      classification.intent,
    );
    const outputValidation = this.outputValidatorService.validate({
      response: safeAgentText,
      intent: classification.intent,
    });
    const responseText = outputValidation.response;

    await this.saveMessagePair(
      conversationId,
      userMessage,
      responseText,
      contextChunks,
    );

    await this.intentLoggingService.log({
      userId,
      message: userMessage,
      classification,
      finalToolCalled: agentResponse.toolCalls
        .map((call) => call.toolName)
        .join(','),
      accepted: outputValidation.valid,
    });

    if (previousMessages.length === 0 && !conversation.title) {
      conversation.title = userMessage.slice(0, 100);
      conversation.updatedBy = userId;
      await this.conversationRepository.save(conversation);
    }

    return {
      response: responseText,
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

  private async classifyIntent(message: string): Promise<IntentClassification> {
    const ruleResult = this.ruleBasedGuardService.check(message);
    if (ruleResult) return ruleResult;

    let classification: IntentClassification;
    try {
      classification = await this.intentRouterService.classify(message);
    } catch (error: any) {
      this.logger.warn(`Embedding intent router failed: ${error.message}`);
      classification = {
        intent: AiIntent.AMBIGUOUS,
        confidence: 0,
        reason: 'Embedding intent router failed.',
        nearest: [],
      };
    }

    if (classification.intent !== AiIntent.AMBIGUOUS) {
      return classification;
    }

    return this.llmClassifierService.classify(message, {
      nearestExamples: classification.nearest,
    });
  }

  private buildSafeAgentText(
    agentResponse: { text: string; toolCalls: TaskAgentToolCall[] },
    intent: AiIntent,
  ): string {
    if (!this.outputValidatorService.hasReasoningLeak(agentResponse.text)) {
      return agentResponse.text;
    }

    if (intent === AiIntent.DASHBOARD_QUERY) {
      const countCall = [...agentResponse.toolCalls]
        .reverse()
        .find((call) => call.toolName === 'countTasks');
      const countOutput = countCall?.output as
        | {
            total?: number;
            groupBy?: string;
            groups?: Array<{ label?: string; key: string; count: number }>;
          }
        | undefined;

      if (typeof countOutput?.total === 'number') {
        const groupText = countOutput.groups?.length
          ? ` (${countOutput.groups
              .map((item) => `${item.label || item.key}: ${item.count}`)
              .join(', ')})`
          : '';
        return `Bạn có ${countOutput.total} việc${groupText}.`;
      }

      const statsCall = [...agentResponse.toolCalls]
        .reverse()
        .find((call) => call.toolName === 'getDashboardStats');
      const stats = statsCall?.output as
        | {
            total?: number;
            byStatus?: Array<{ statusName: string; count: number }>;
          }
        | undefined;

      if (typeof stats?.total === 'number') {
        const statusText = stats.byStatus?.length
          ? ` (${stats.byStatus.map((item) => `${item.statusName}: ${item.count}`).join(', ')})`
          : '';
        return `Bạn có ${stats.total} việc${statusText}.`;
      }
    }

    return 'Mình đã xử lý yêu cầu trong hệ thống Todo, nhưng phản hồi từ AI không hợp lệ. Bạn vui lòng hỏi lại ngắn gọn hơn.';
  }
}
