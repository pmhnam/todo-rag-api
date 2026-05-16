import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import type { ModelMessage } from 'ai';
import { AiSdkService } from '../ai/ai-sdk.service';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { TaskToolFactory } from '../tools/task-tool.factory';

export type TaskAgentToolCall = {
  toolName: string;
  input: unknown;
  output?: unknown;
};

export type TaskAgentPendingConfirmation = {
  toolName: string;
  input: unknown;
  message: string;
};

export type TaskAgentResponse = {
  text: string;
  toolCalls: TaskAgentToolCall[];
  pendingConfirmation?: TaskAgentPendingConfirmation;
};

@Injectable()
export class TaskAgentService {
  private readonly logger = new Logger(TaskAgentService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly taskToolFactory: TaskToolFactory,
  ) {}

  async chat(params: {
    userId: Uuid;
    userMessage: string;
    previousMessages: RagMessageEntity[];
    projectId?: Uuid;
    ragContext?: string;
  }): Promise<TaskAgentResponse> {
    this.logger.debug(
      `Task agent chat: user=${params.userId}, messages=${params.previousMessages.length}`,
    );

    const tool = await this.aiSdkService.getToolFactory();
    const tools = this.taskToolFactory.createTools(tool, {
      userId: params.userId,
    });

    const response = await this.aiSdkService.generateWithTools({
      system: this.buildSystemPrompt(params.projectId, params.ragContext),
      messages: this.buildMessages(params.previousMessages, params.userMessage),
      tools,
    });

    const pendingConfirmation = this.findPendingConfirmation(
      response.toolCalls,
    );

    return {
      ...response,
      text: pendingConfirmation?.message || response.text,
      pendingConfirmation,
    };
  }

  async confirmTool(params: {
    userId: Uuid;
    toolName: string;
    input: unknown;
  }): Promise<TaskAgentResponse> {
    const output = await this.taskToolFactory.executeConfirmedTool(
      params.toolName,
      params.input,
      { userId: params.userId },
    );

    return {
      text: this.buildConfirmationText(params.toolName),
      toolCalls: [
        {
          toolName: params.toolName,
          input: params.input,
          output,
        },
      ],
    };
  }

  private buildMessages(
    previousMessages: RagMessageEntity[],
    userMessage: string,
  ): ModelMessage[] {
    const messages = previousMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  private buildSystemPrompt(projectId?: Uuid, ragContext?: string): string {
    return `Bạn là AI agent hỗ trợ quản lý task qua chat.

Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
- Chỉ thao tác dữ liệu của user hiện tại thông qua tools được cung cấp.
- Khi user muốn tạo, cập nhật, xoá, đổi trạng thái, xem chi tiết hoặc tìm task, hãy dùng tool phù hợp.
- Khi user muốn tạo/sửa/xoá project hoặc status/column, hãy dùng tool quản trị project/status phù hợp.
- Khi user muốn link/unlink task với Jira issue key, hãy dùng linkJiraIssue.
- Khi tìm hoặc liệt kê task, mặc định tìm trên tất cả project nếu user không chỉ định project.
- Khi user nhắc tên project/board nhưng thiếu projectId, hãy dùng listProjects để tìm project phù hợp.
- Khi cần biết hoặc resolve tên status/column trong một project, hãy dùng listTaskStatuses trước khi đổi trạng thái.
- Chỉ hỏi lại projectId/board khi thao tác bắt buộc cần project cụ thể, ví dụ tạo task mới.
- Nếu thiếu định danh task và không thể tìm chắc chắn bằng tên, hãy hỏi lại thay vì đoán.
- Nếu tìm thấy nhiều task có thể khớp, hãy hỏi user chọn task cụ thể.
- Không tự ý thay đổi dữ liệu nếu ý định của user chưa rõ.
- Với thao tác xoá, chỉ thực hiện khi user yêu cầu rõ ràng và đã xác định đúng project/status/task.
- Sau khi tool thay đổi dữ liệu thành công, tóm tắt chính xác hành động đã thực hiện.

Project hiện tại: ${projectId || 'chưa được chọn'}.

Ngữ cảnh RAG tham khảo:
${ragContext || 'Không có ngữ cảnh bổ sung.'}`;
  }

  private findPendingConfirmation(
    toolCalls: TaskAgentToolCall[],
  ): TaskAgentPendingConfirmation | undefined {
    for (const call of toolCalls) {
      const output = call.output as
        | { requiresConfirmation?: boolean; message?: string }
        | undefined;
      if (output?.requiresConfirmation) {
        return {
          toolName: call.toolName,
          input: call.input,
          message:
            output.message ||
            `Cần xác nhận trước khi thực hiện ${call.toolName}.`,
        };
      }
    }
  }

  private buildConfirmationText(toolName: string): string {
    switch (toolName) {
      case 'deleteTask':
        return 'Đã xoá task theo xác nhận của bạn.';
      case 'deleteProject':
        return 'Đã xoá project theo xác nhận của bạn.';
      case 'deleteTaskStatus':
        return 'Đã xoá column/status theo xác nhận của bạn.';
      default:
        return 'Đã thực hiện thao tác theo xác nhận của bạn.';
    }
  }
}
