import { JiraIntegrationService } from '@/api/jira-integration/services/jira-integration.service';
import { TodoStatusEntity } from '@/api/todo/entities/todo-status.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { JiraSyncStatus } from '@/api/todo/enums/jira-sync-status.enum';
import { TodoPriority } from '@/api/todo/enums/todo-priority.enum';
import { Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { ModelMessage } from 'ai';
import { ILike, Repository } from 'typeorm';
import { z } from 'zod';
import { RagMessageEntity } from '../entities/rag-message.entity';
import { SourceType } from '../enums/source-type.enum';
import { IndexingService } from './indexing.service';

type AiModule = typeof import('ai');
type OpenRouterModule = typeof import('@openrouter/ai-sdk-provider');

export type TaskAgentToolCall = {
  toolName: string;
  input: unknown;
  output?: unknown;
};

export type TaskAgentResponse = {
  text: string;
  toolCalls: TaskAgentToolCall[];
};

const nullableString = z.string().nullable().optional();

@Injectable()
export class TaskAgentService {
  private readonly logger = new Logger(TaskAgentService.name);

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
    private readonly indexingService: IndexingService,
    private readonly jiraIntegrationService: JiraIntegrationService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async chat(params: {
    userId: Uuid;
    userMessage: string;
    previousMessages: RagMessageEntity[];
    projectId?: Uuid;
    ragContext?: string;
  }): Promise<TaskAgentResponse> {
    const { generateText, stepCountIs, tool } = await this.loadAiSdk();
    const { createOpenRouter } = await this.loadOpenRouterSdk();
    const apiKey = this.configService.get('llm.openrouterApiKey', {
      infer: true,
    });

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const openrouter = createOpenRouter({ apiKey });
    const modelName = this.configService.get('llm.openrouterModel', {
      infer: true,
    });
    const model = openrouter.chat(modelName);
    const toolEvents: TaskAgentToolCall[] = [];

    const messages: ModelMessage[] = params.previousMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    messages.push({ role: 'user', content: params.userMessage });

    const result = await generateText({
      model,
      system: this.buildSystemPrompt(params.projectId, params.ragContext),
      messages,
      tools: {
        findTasks: tool({
          description:
            'Find tasks owned by the current user. Use this when the user mentions a task by name or asks to list/filter tasks.',
          inputSchema: z.object({
            projectId: z.string().uuid().describe('Project/board ID'),
            query: z
              .string()
              .optional()
              .describe('Text to search in task title'),
            statusId: z.string().uuid().optional(),
            priority: z.enum(TodoPriority).optional(),
          }),
          execute: async ({ projectId, query, statusId, priority }) =>
            this.findTasks(params.userId, {
              projectId: projectId as Uuid,
              query,
              statusId: statusId as Uuid | undefined,
              priority,
            }),
        }),
        getTaskDetails: tool({
          description: 'Get details for a single task by task ID.',
          inputSchema: z.object({
            taskId: z.string().uuid(),
          }),
          execute: async ({ taskId }) =>
            this.getTaskDetails(taskId as Uuid, params.userId),
        }),
        createTask: tool({
          description:
            'Create a new task for the current user. If statusId is unknown, use statusName to resolve a board column.',
          inputSchema: z.object({
            projectId: z.string().uuid(),
            title: z.string().min(1).max(255),
            description: nullableString,
            statusId: z.string().uuid().optional(),
            statusName: z.string().optional(),
            priority: z.enum(TodoPriority).optional(),
            dueDate: nullableString.describe(
              'Date string in YYYY-MM-DD format',
            ),
            tags: z.array(z.string()).optional(),
          }),
          execute: async (input) =>
            this.createTask(params.userId, {
              ...input,
              projectId: input.projectId as Uuid,
              statusId: input.statusId as Uuid | undefined,
            }),
        }),
        updateTask: tool({
          description:
            'Update task fields except status. Use updateTaskStatus for status/column changes.',
          inputSchema: z.object({
            taskId: z.string().uuid(),
            title: z.string().min(1).max(255).optional(),
            description: nullableString,
            priority: z.enum(TodoPriority).optional(),
            dueDate: nullableString.describe(
              'Date string in YYYY-MM-DD format',
            ),
            tags: z.array(z.string()).optional(),
            externalLinks: z
              .array(
                z.object({
                  name: z.string().min(1).max(100),
                  url: z.string().url(),
                }),
              )
              .optional(),
          }),
          execute: async ({ taskId, ...updates }) =>
            this.updateTask(taskId as Uuid, params.userId, updates),
        }),
        updateTaskStatus: tool({
          description:
            'Move a task to another status/column. Resolve by statusName when statusId is not provided.',
          inputSchema: z.object({
            taskId: z.string().uuid(),
            statusId: z.string().uuid().optional(),
            statusName: z.string().optional(),
          }),
          execute: async ({ taskId, statusId, statusName }) =>
            this.updateTaskStatus(taskId as Uuid, params.userId, {
              statusId: statusId as Uuid | undefined,
              statusName,
            }),
        }),
      },
      stopWhen: stepCountIs(5),
      maxOutputTokens: this.configService.get('llm.maxTokens', { infer: true }),
      temperature: this.configService.get('llm.temperature', { infer: true }),
      experimental_onToolCallStart: ({ toolName, input }) => {
        toolEvents.push({ toolName, input });
      },
      experimental_onToolCallFinish: ({ toolName, output, error }) => {
        const event = [...toolEvents]
          .reverse()
          .find(
            (item) => item.toolName === toolName && item.output === undefined,
          );
        if (event) {
          event.output = error ? { error: String(error) } : output;
        }
      },
    } as any);

    return {
      text: result.text,
      toolCalls: toolEvents,
    };
  }

  private buildSystemPrompt(projectId?: Uuid, ragContext?: string): string {
    return `Bạn là AI agent hỗ trợ quản lý task qua chat.

Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
- Chỉ thao tác dữ liệu của user hiện tại thông qua tools được cung cấp.
- Khi user muốn tạo, cập nhật, đổi trạng thái, xem chi tiết hoặc tìm task, hãy dùng tool phù hợp.
- Nếu thiếu projectId/board hoặc thiếu định danh task và không thể tìm chắc chắn bằng tên, hãy hỏi lại thay vì đoán.
- Nếu tìm thấy nhiều task có thể khớp, hãy hỏi user chọn task cụ thể.
- Không tự ý thay đổi dữ liệu nếu ý định của user chưa rõ.
- Sau khi tool thay đổi dữ liệu thành công, tóm tắt chính xác hành động đã thực hiện.

Project hiện tại: ${projectId || 'chưa được chọn'}.

Ngữ cảnh RAG tham khảo:
${ragContext || 'Không có ngữ cảnh bổ sung.'}`;
  }

  private async findTasks(
    userId: Uuid,
    params: {
      projectId: Uuid;
      query?: string;
      statusId?: Uuid;
      priority?: TodoPriority;
    },
  ) {
    const query = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.status', 'status')
      .where('todo.user_id = :userId', { userId })
      .andWhere('todo.project_id = :projectId', { projectId: params.projectId })
      .orderBy('todo.updatedAt', 'DESC')
      .take(10);

    if (params.query) {
      query.andWhere('todo.title ILIKE :q', { q: `%${params.query}%` });
    }

    if (params.statusId) {
      query.andWhere('todo.status_id = :statusId', {
        statusId: params.statusId,
      });
    }

    if (params.priority) {
      query.andWhere('todo.priority = :priority', {
        priority: params.priority,
      });
    }

    const todos = await query.getMany();
    return todos.map((todo) => this.toToolTodo(todo));
  }

  private async getTaskDetails(taskId: Uuid, userId: Uuid) {
    const todo = await this.getOwnedTask(taskId, userId);
    return this.toToolTodo(todo, true);
  }

  private async createTask(
    userId: Uuid,
    input: {
      projectId: Uuid;
      title: string;
      description?: string | null;
      statusId?: Uuid;
      statusName?: string;
      priority?: TodoPriority;
      dueDate?: string | null;
      tags?: string[];
    },
  ) {
    const status = input.statusId
      ? await this.getOwnedStatus(input.statusId, userId, input.projectId)
      : await this.resolveStatus(
          userId,
          input.projectId,
          input.statusName || 'To Do',
        );

    const todo = this.todoRepository.create({
      projectId: input.projectId,
      title: input.title,
      description: input.description || null,
      statusId: status.id,
      status,
      priority: input.priority || TodoPriority.MEDIUM,
      dueDate: this.parseDate(input.dueDate),
      tags: input.tags,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoRepository.save(todo);
    saved.status = status;
    await this.syncJiraStatusAfterLocalMove(userId, saved);
    await this.reindex(userId, saved);
    return this.toToolTodo(saved, true);
  }

  private async updateTask(
    taskId: Uuid,
    userId: Uuid,
    updates: {
      title?: string;
      description?: string | null;
      priority?: TodoPriority;
      dueDate?: string | null;
      tags?: string[];
      externalLinks?: { name: string; url: string }[];
    },
  ) {
    const todo = await this.getOwnedTask(taskId, userId);

    if (updates.title !== undefined) todo.title = updates.title;
    if (updates.description !== undefined) {
      todo.description = updates.description || null;
    }
    if (updates.priority !== undefined) todo.priority = updates.priority;
    if (updates.dueDate !== undefined)
      todo.dueDate = this.parseDate(updates.dueDate);
    if (updates.tags !== undefined) todo.tags = updates.tags;
    if (updates.externalLinks !== undefined)
      todo.externalLinks = updates.externalLinks;
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);
    await this.reindex(userId, saved);
    return this.toToolTodo(saved, true);
  }

  private async updateTaskStatus(
    taskId: Uuid,
    userId: Uuid,
    input: { statusId?: Uuid; statusName?: string },
  ) {
    const todo = await this.getOwnedTask(taskId, userId);
    const status = input.statusId
      ? await this.getOwnedStatus(input.statusId, userId, todo.projectId)
      : await this.resolveStatus(userId, todo.projectId, input.statusName);

    todo.statusId = status.id;
    todo.status = status;
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);
    saved.status = status;
    await this.reindex(userId, saved);
    return this.toToolTodo(saved, true);
  }

  private async getOwnedTask(taskId: Uuid, userId: Uuid): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOne({
      where: { id: taskId, userId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    return todo;
  }

  private async getOwnedStatus(
    statusId: Uuid,
    userId: Uuid,
    projectId: Uuid,
  ): Promise<TodoStatusEntity> {
    const status = await this.todoStatusRepository.findOne({
      where: { id: statusId, userId, projectId },
    });

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    return status;
  }

  private async resolveStatus(
    userId: Uuid,
    projectId: Uuid,
    statusName?: string,
  ): Promise<TodoStatusEntity> {
    if (!statusName) {
      throw new Error('Cần statusId hoặc statusName để xác định cột task.');
    }

    const statuses = await this.todoStatusRepository.find({
      where: { userId, projectId, name: ILike(`%${statusName}%`) },
      take: 5,
      order: { order: 'ASC' },
    });

    if (statuses.length === 0) {
      throw new Error(
        `Không tìm thấy status "${statusName}" trong project hiện tại.`,
      );
    }

    if (statuses.length > 1) {
      throw new Error(
        `Tìm thấy nhiều status khớp "${statusName}": ${statuses
          .map((status) => `${status.name} (${status.id})`)
          .join(', ')}.`,
      );
    }

    return statuses[0];
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Ngày không hợp lệ: ${value}`);
    }
    return date;
  }

  private async reindex(userId: Uuid, todo: TodoEntity): Promise<void> {
    const content = [todo.title, todo.description].filter(Boolean).join('\n');

    try {
      await this.indexingService.reindexIfChanged(
        userId,
        SourceType.TODO,
        todo.id,
        content,
        {
          title: todo.title,
          priority: todo.priority,
          status: todo.status?.name,
        },
      );
    } catch (error) {
      this.logger.warn(`Failed to reindex todo ${todo.id}: ${error.message}`);
    }
  }

  private async syncJiraStatusAfterLocalMove(
    userId: Uuid,
    todo: TodoEntity,
  ): Promise<void> {
    try {
      const syncStatus =
        await this.jiraIntegrationService.syncTodoStatusTransition(
          userId,
          todo,
        );
      if (!syncStatus) return;

      todo.jiraSyncStatus = syncStatus;
      todo.jiraLastSyncedAt =
        syncStatus === JiraSyncStatus.SYNCED
          ? new Date()
          : todo.jiraLastSyncedAt;
      await this.todoRepository.save(todo);
    } catch (error) {
      todo.jiraSyncStatus = JiraSyncStatus.FAILED;
      await this.todoRepository.save(todo);
      this.logger.warn(
        `Failed to sync Jira transition for todo ${todo.id}: ${error.message}`,
      );
    }
  }

  private toToolTodo(todo: TodoEntity, includeDetails = false) {
    return {
      id: todo.id,
      projectId: todo.projectId,
      title: todo.title,
      description: includeDetails ? todo.description : undefined,
      statusId: todo.statusId,
      statusName: todo.status?.name,
      priority: todo.priority,
      dueDate: todo.dueDate,
      tags: todo.tags,
      externalLinks: includeDetails ? todo.externalLinks : undefined,
      aiSummary: includeDetails ? todo.aiSummary : undefined,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }

  private async loadAiSdk(): Promise<AiModule> {
    return new Function('specifier', 'return import(specifier)')('ai');
  }

  private async loadOpenRouterSdk(): Promise<OpenRouterModule> {
    return new Function('specifier', 'return import(specifier)')(
      '@openrouter/ai-sdk-provider',
    );
  }
}
