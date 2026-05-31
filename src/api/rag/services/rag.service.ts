import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { ToolConfirmationDto } from '../dto/chat.req.dto';
import { RagConversationEntity } from '../entities/rag-conversation.entity';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { AiIntent } from '../enums/ai-intent.enum';
import {
  OutputValidatorService,
  TODO_SCOPE_REFUSAL,
} from '../guard/output-validator.service';
import { IntentClassifierService } from '../intent/intent-classifier.service';
import { IntentLoggingService } from '../intent/intent-logging.service';
import { INTENT_TOOL_PERMISSIONS } from '../permission/intent-permissions';
import { RagContextChunk } from '../types/rag.types';
import { RagConversationService } from './rag-conversation.service';
import { RagPromptBuilderService } from './rag-prompt-builder.service';
import { RagSettingsService } from './rag-settings.service';
import { SearchService } from './search.service';
import { TaskAgentService, TaskAgentToolCall } from './task-agent.service';

const AMBIGUOUS_RESPONSE =
  'Bạn muốn tôi thao tác gì trong hệ thống task/project? Ví dụ: tạo task, tìm task, đổi trạng thái, thêm comment, gắn tag hoặc xem dashboard.';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly conversationService: RagConversationService,
    private readonly searchService: SearchService,
    private readonly ragPromptBuilderService: RagPromptBuilderService,
    private readonly ragSettingsService: RagSettingsService,
    private readonly taskAgentService: TaskAgentService,
    private readonly intentClassifierService: IntentClassifierService,
    private readonly outputValidatorService: OutputValidatorService,
    private readonly intentLoggingService: IntentLoggingService,
  ) {}

  async query(
    userId: Uuid,
    conversationId: Uuid,
    userMessage: string,
    topK?: number,
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
    const conversation = await this.conversationService.getConversation(
      conversationId,
      userId,
    );
    if (confirmation) {
      const agentResponse = await this.taskAgentService.confirmTool({
        userId,
        toolName: confirmation.approvedToolName,
        input: confirmation.approvedInput,
      });

      await this.conversationService.saveMessagePair({
        conversationId,
        userMessage,
        assistantMessage: agentResponse.text,
        contextChunks: [],
      });

      return {
        response: agentResponse.text,
        contextChunks: [],
        toolCalls: agentResponse.toolCalls,
      };
    }

    const classification =
      await this.intentClassifierService.classify(userMessage);

    if (classification.intent === AiIntent.OUT_OF_SCOPE) {
      await this.conversationService.saveMessagePair({
        conversationId,
        userMessage,
        assistantMessage: TODO_SCOPE_REFUSAL,
        contextChunks: [],
      });
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
      await this.conversationService.saveMessagePair({
        conversationId,
        userMessage,
        assistantMessage: AMBIGUOUS_RESPONSE,
        contextChunks: [],
      });
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

    const settings = projectId
      ? await this.ragSettingsService.getProjectSettings(projectId, userId)
      : undefined;
    const effectiveTopK = topK ?? settings?.topK ?? 5;

    const searchResults = await this.searchService.search(
      userId,
      userMessage,
      effectiveTopK,
      {
        projectId,
        maxDistance: settings?.maxDistance,
        filterByProject: settings?.filterByProject,
        enableQueryRewrite: settings?.enableQueryRewrite,
      },
    );
    const context = this.ragPromptBuilderService.buildContext(searchResults);
    const contextChunks =
      this.ragPromptBuilderService.buildContextChunks(searchResults);

    this.logger.debug(
      `RAG query: found ${searchResults.length} context chunks`,
    );

    const previousMessages = await this.conversationService.getRecentMessages(
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

    await this.conversationService.saveMessagePair({
      conversationId,
      userMessage,
      assistantMessage: responseText,
      contextChunks,
    });

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
      await this.conversationService.setTitleIfEmpty({
        conversation,
        title: userMessage,
        userId,
      });
    }

    return {
      response: responseText,
      contextChunks,
      toolCalls: agentResponse.toolCalls,
      pendingConfirmation: agentResponse.pendingConfirmation,
    };
  }

  async search(userId: Uuid, query: string, topK?: number, projectId?: Uuid) {
    const settings = projectId
      ? await this.ragSettingsService.getProjectSettings(projectId, userId)
      : undefined;
    const effectiveTopK = topK ?? settings?.topK ?? 5;
    return this.searchService.search(userId, query, effectiveTopK, {
      projectId,
      maxDistance: settings?.maxDistance,
      filterByProject: settings?.filterByProject,
      enableQueryRewrite: settings?.enableQueryRewrite,
    });
  }

  createConversation(
    userId: Uuid,
    title?: string,
  ): Promise<RagConversationEntity> {
    return this.conversationService.createConversation(userId, title);
  }

  getConversations(userId: Uuid): Promise<RagConversationEntity[]> {
    return this.conversationService.getConversations(userId);
  }

  async getConversation(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagConversationEntity> {
    return this.conversationService.getConversation(conversationId, userId);
  }

  async getMessages(
    conversationId: Uuid,
    userId: Uuid,
  ): Promise<RagMessageEntity[]> {
    return this.conversationService.getMessages(conversationId, userId);
  }

  async deleteConversation(conversationId: Uuid, userId: Uuid): Promise<void> {
    return this.conversationService.deleteConversation(conversationId, userId);
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
