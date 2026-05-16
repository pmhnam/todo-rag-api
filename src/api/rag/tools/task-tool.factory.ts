import { ProjectService } from '@/api/project/services/project.service';
import { CreateTodoReqDto } from '@/api/todo/dto/create-todo.req.dto';
import { ListTodoStatusReqDto } from '@/api/todo/dto/list-todo-status.req.dto';
import { UpdateTodoReqDto } from '@/api/todo/dto/update-todo.req.dto';
import { TodoPriority } from '@/api/todo/enums/todo-priority.enum';
import { CreateTodoUseCase } from '@/api/todo/use-cases/create-todo.use-case';
import { FindAgentTodosUseCase } from '@/api/todo/use-cases/find-agent-todos.use-case';
import { FindTodoStatusesUseCase } from '@/api/todo/use-cases/find-todo-statuses.use-case';
import { GetTodoDetailUseCase } from '@/api/todo/use-cases/get-todo-detail.use-case';
import { ResolveTodoStatusUseCase } from '@/api/todo/use-cases/resolve-todo-status.use-case';
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
}
