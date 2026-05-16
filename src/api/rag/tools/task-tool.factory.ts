import { CreateProjectReqDto } from '@/api/project/dto/create-project.req.dto';
import { UpdateProjectReqDto } from '@/api/project/dto/update-project.req.dto';
import { ProjectService } from '@/api/project/services/project.service';
import { CreateTodoStatusReqDto } from '@/api/todo/dto/create-todo-status.req.dto';
import { CreateTodoReqDto } from '@/api/todo/dto/create-todo.req.dto';
import { LinkJiraIssueReqDto } from '@/api/todo/dto/link-jira-issue.req.dto';
import { ListTodoStatusReqDto } from '@/api/todo/dto/list-todo-status.req.dto';
import { UpdateTodoStatusReqDto } from '@/api/todo/dto/update-todo-status.req.dto';
import { UpdateTodoReqDto } from '@/api/todo/dto/update-todo.req.dto';
import { TodoPriority } from '@/api/todo/enums/todo-priority.enum';
import { CreateTodoStatusUseCase } from '@/api/todo/use-cases/create-todo-status.use-case';
import { CreateTodoUseCase } from '@/api/todo/use-cases/create-todo.use-case';
import { DeleteTodoStatusUseCase } from '@/api/todo/use-cases/delete-todo-status.use-case';
import { DeleteTodoUseCase } from '@/api/todo/use-cases/delete-todo.use-case';
import { FindAgentTodosUseCase } from '@/api/todo/use-cases/find-agent-todos.use-case';
import { FindTodoStatusesUseCase } from '@/api/todo/use-cases/find-todo-statuses.use-case';
import { GetTodoDetailUseCase } from '@/api/todo/use-cases/get-todo-detail.use-case';
import { LinkJiraIssueUseCase } from '@/api/todo/use-cases/link-jira-issue.use-case';
import { ResolveTodoStatusUseCase } from '@/api/todo/use-cases/resolve-todo-status.use-case';
import { UpdateTodoStatusUseCase } from '@/api/todo/use-cases/update-todo-status.use-case';
import { UpdateTodoUseCase } from '@/api/todo/use-cases/update-todo.use-case';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import { Order } from '@/constants/app.constant';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  toToolProject,
  toToolTodo,
  toToolTodoStatus,
} from './task-tool.mapper';
import { AiToolFactory, TaskToolContext } from './task-tool.types';

const nullableString = z.string().nullable().optional();

@Injectable()
export class TaskToolFactory {
  constructor(
    private readonly findAgentTodosUseCase: FindAgentTodosUseCase,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly findTodoStatusesUseCase: FindTodoStatusesUseCase,
    private readonly createTodoUseCase: CreateTodoUseCase,
    private readonly updateTodoUseCase: UpdateTodoUseCase,
    private readonly linkJiraIssueUseCase: LinkJiraIssueUseCase,
    private readonly deleteTodoUseCase: DeleteTodoUseCase,
    private readonly createTodoStatusUseCase: CreateTodoStatusUseCase,
    private readonly updateTodoStatusUseCase: UpdateTodoStatusUseCase,
    private readonly deleteTodoStatusUseCase: DeleteTodoStatusUseCase,
    private readonly resolveTodoStatusUseCase: ResolveTodoStatusUseCase,
    private readonly projectService: ProjectService,
  ) {}

  createTools(tool: AiToolFactory, context: TaskToolContext) {
    return {
      listProjects: tool({
        description:
          'List projects/boards owned by the current user. Use this before creating or filtering tasks when the user mentions a project by name but not projectId.',
        inputSchema: z.object({
          query: z
            .string()
            .optional()
            .describe('Text to search in project name'),
          limit: z.number().int().min(1).max(20).optional(),
        }),
        execute: async ({ query, limit }) => {
          const reqDto = Object.assign(new PageOptionsDto(), {
            q: query,
            limit: limit || 10,
            page: 1,
            order: Order.ASC,
          });
          const result = await this.projectService.findAll(
            context.userId,
            reqDto,
          );
          return result.data.map((project) => toToolProject(project));
        },
      }),
      createProject: tool({
        description:
          'Create a new project/board for the current user. Use only when the user clearly asks to create a project or board.',
        inputSchema: z.object({
          name: z.string().min(1).max(255),
          description: nullableString,
        }),
        execute: async ({ name, description }) => {
          const project = await this.projectService.create(context.userId, {
            name,
            description: description || undefined,
          } as CreateProjectReqDto);

          return toToolProject(project);
        },
      }),
      updateProject: tool({
        description:
          'Update a project/board name or description. Use only after the projectId is known.',
        inputSchema: z.object({
          projectId: z.string().uuid(),
          name: z.string().min(1).max(255).optional(),
          description: nullableString,
        }),
        execute: async ({ projectId, name, description }) => {
          const project = await this.projectService.update(
            projectId as Uuid,
            context.userId,
            {
              name,
              description: description || undefined,
            } as UpdateProjectReqDto,
          );

          return toToolProject(project);
        },
      }),
      deleteProject: tool({
        description:
          'Delete a project/board owned by the current user. Use only when the user explicitly asks to delete a project and the projectId is known.',
        inputSchema: z.object({
          projectId: z.string().uuid(),
        }),
        execute: async (input) =>
          this.requireConfirmation('deleteProject', input),
      }),
      listTaskStatuses: tool({
        description:
          'List task statuses/columns for a project. Use this to resolve statusId or understand valid status names before moving or creating tasks.',
        inputSchema: z.object({
          projectId: z.string().uuid().describe('Project/board ID'),
          limit: z.number().int().min(1).max(50).optional(),
        }),
        execute: async ({ projectId, limit }) => {
          const reqDto = Object.assign(new ListTodoStatusReqDto(), {
            projectId,
            limit: limit || 50,
            page: 1,
            order: Order.ASC,
          });
          const result = await this.findTodoStatusesUseCase.execute(
            context.userId,
            reqDto,
          );
          return result.data.map((status) => toToolTodoStatus(status));
        },
      }),
      createTaskStatus: tool({
        description:
          'Create a new task status/column in a project. Use only when the user clearly asks to add a status or column.',
        inputSchema: z.object({
          projectId: z.string().uuid(),
          name: z.string().min(1).max(100),
          order: z.number().int().min(0).optional(),
          color: nullableString.describe(
            'Optional color hex code, e.g. #FF5733',
          ),
        }),
        execute: async ({ projectId, name, order, color }) => {
          const status = await this.createTodoStatusUseCase.execute(
            context.userId,
            {
              projectId,
              name,
              order,
              color: color || undefined,
            } as CreateTodoStatusReqDto,
          );

          return toToolTodoStatus(status);
        },
      }),
      updateTaskStatusDefinition: tool({
        description:
          'Update a task status/column definition, such as name, order, or color. Do not use this to move a task; use updateTaskStatus for moving tasks.',
        inputSchema: z.object({
          statusId: z.string().uuid(),
          name: z.string().min(1).max(100).optional(),
          order: z.number().int().min(0).optional(),
          color: nullableString.describe(
            'Optional color hex code, e.g. #FF5733',
          ),
        }),
        execute: async ({ statusId, name, order, color }) => {
          const status = await this.updateTodoStatusUseCase.execute(
            statusId as Uuid,
            context.userId,
            {
              name,
              order,
              color: color || undefined,
            } as UpdateTodoStatusReqDto,
          );

          return toToolTodoStatus(status);
        },
      }),
      deleteTaskStatus: tool({
        description:
          'Delete an empty task status/column. The backend rejects deletion when the status still has tasks.',
        inputSchema: z.object({
          statusId: z.string().uuid(),
        }),
        execute: async (input) =>
          this.requireConfirmation('deleteTaskStatus', input),
      }),
      findTasks: tool({
        description:
          'Find tasks owned by the current user across all projects. Optionally filter by project when a projectId is provided.',
        inputSchema: z.object({
          projectId: z.string().uuid().optional().describe('Project/board ID'),
          query: z.string().optional().describe('Text to search in task title'),
          statusId: z.string().uuid().optional(),
          priority: z.enum(TodoPriority).optional(),
        }),
        execute: async ({ projectId, query, statusId, priority }) => {
          const todos = await this.findAgentTodosUseCase.execute(
            context.userId,
            {
              projectId: projectId as Uuid | undefined,
              query,
              statusId: statusId as Uuid | undefined,
              priority,
            },
          );
          return todos.map((todo) => toToolTodo(todo));
        },
      }),
      getTaskDetails: tool({
        description: 'Get details for a single task by task ID.',
        inputSchema: z.object({
          taskId: z.string().uuid(),
        }),
        execute: async ({ taskId }) => {
          const todo = await this.getTodoDetailUseCase.getEntity(
            taskId as Uuid,
            context.userId,
          );
          return toToolTodo(todo, true);
        },
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
          dueDate: nullableString.describe('Date string in YYYY-MM-DD format'),
          tags: z.array(z.string()).optional(),
        }),
        execute: async (input) => {
          const statusId = await this.resolveStatusId(context.userId, {
            projectId: input.projectId as Uuid,
            statusId: input.statusId as Uuid | undefined,
            statusName: input.statusName || 'To Do',
          });
          return this.createTodoUseCase.execute(context.userId, {
            projectId: input.projectId,
            title: input.title,
            description: input.description || undefined,
            statusId,
            priority: input.priority,
            dueDate: this.parseDate(input.dueDate),
            tags: input.tags,
          } as CreateTodoReqDto);
        },
      }),
      updateTask: tool({
        description:
          'Update task fields except status. Use updateTaskStatus for status/column changes.',
        inputSchema: z.object({
          taskId: z.string().uuid(),
          title: z.string().min(1).max(255).optional(),
          description: nullableString,
          priority: z.enum(TodoPriority).optional(),
          dueDate: nullableString.describe('Date string in YYYY-MM-DD format'),
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
          this.updateTodoUseCase.execute(taskId as Uuid, context.userId, {
            ...updates,
            description: updates.description || undefined,
            dueDate: this.parseDate(updates.dueDate),
          } as UpdateTodoReqDto),
      }),
      deleteTask: tool({
        description:
          'Delete a task owned by the current user. Use only when the user explicitly asks to delete/remove a task and the taskId is known.',
        inputSchema: z.object({
          taskId: z.string().uuid(),
        }),
        execute: async (input) => this.requireConfirmation('deleteTask', input),
      }),
      linkJiraIssue: tool({
        description:
          'Link or unlink a task with a Jira issue key. Provide jiraIssueKey to link, or null/empty string to unlink.',
        inputSchema: z.object({
          taskId: z.string().uuid(),
          jiraIssueKey: nullableString.describe(
            'Jira issue key, e.g. PROJ-123. Use null or empty string to unlink.',
          ),
        }),
        execute: async ({ taskId, jiraIssueKey }) => {
          const todo = await this.linkJiraIssueUseCase.execute(
            taskId as Uuid,
            context.userId,
            {
              jiraIssueKey,
            } as LinkJiraIssueReqDto,
          );

          return toToolTodo(todo, true);
        },
      }),
      updateTaskStatus: tool({
        description:
          'Move a task to another status/column. Resolve by statusName when statusId is not provided.',
        inputSchema: z.object({
          taskId: z.string().uuid(),
          statusId: z.string().uuid().optional(),
          statusName: z.string().optional(),
        }),
        execute: async ({ taskId, statusId, statusName }) => {
          const todo = await this.getTodoDetailUseCase.getEntity(
            taskId as Uuid,
            context.userId,
          );
          const resolvedStatusId = await this.resolveStatusId(context.userId, {
            projectId: todo.projectId,
            statusId: statusId as Uuid | undefined,
            statusName,
          });
          const updatedTodo = await this.updateTodoUseCase.execute(
            taskId as Uuid,
            context.userId,
            {
              statusId: resolvedStatusId,
            } as UpdateTodoReqDto,
          );
          return toToolTodo(updatedTodo, true);
        },
      }),
    };
  }

  async executeConfirmedTool(
    toolName: string,
    input: unknown,
    context: TaskToolContext,
  ): Promise<unknown> {
    switch (toolName) {
      case 'deleteProject': {
        const parsed = z.object({ projectId: z.string().uuid() }).parse(input);
        await this.projectService.delete(
          parsed.projectId as Uuid,
          context.userId,
        );
        return { id: parsed.projectId, deleted: true };
      }
      case 'deleteTaskStatus': {
        const parsed = z.object({ statusId: z.string().uuid() }).parse(input);
        await this.deleteTodoStatusUseCase.execute(
          parsed.statusId as Uuid,
          context.userId,
        );
        return { id: parsed.statusId, deleted: true };
      }
      case 'deleteTask': {
        const parsed = z.object({ taskId: z.string().uuid() }).parse(input);
        await this.deleteTodoUseCase.execute(
          parsed.taskId as Uuid,
          context.userId,
        );
        return { id: parsed.taskId, deleted: true };
      }
      default:
        throw new Error(`Tool ${toolName} does not support confirmation`);
    }
  }

  private async resolveStatusId(
    userId: Uuid,
    input: { projectId: Uuid; statusId?: Uuid; statusName?: string },
  ): Promise<string> {
    const status = input.statusId
      ? await this.resolveTodoStatusUseCase.byId(
          input.statusId,
          userId,
          input.projectId,
        )
      : await this.resolveTodoStatusUseCase.byName(
          userId,
          input.projectId,
          input.statusName,
        );

    return status.id;
  }

  private parseDate(value?: string | null): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Ngày không hợp lệ: ${value}`);
    }
    return date;
  }

  private requireConfirmation(toolName: string, input: unknown) {
    return {
      requiresConfirmation: true,
      toolName,
      input,
      message: this.buildConfirmationMessage(toolName),
    };
  }

  private buildConfirmationMessage(toolName: string): string {
    switch (toolName) {
      case 'deleteTask':
        return 'AI muốn xoá task này. Vui lòng xác nhận trước khi thực hiện.';
      case 'deleteProject':
        return 'AI muốn xoá project này. Vui lòng xác nhận trước khi thực hiện.';
      case 'deleteTaskStatus':
        return 'AI muốn xoá column/status này. Vui lòng xác nhận trước khi thực hiện.';
      default:
        return 'Thao tác này cần xác nhận trước khi thực hiện.';
    }
  }
}
