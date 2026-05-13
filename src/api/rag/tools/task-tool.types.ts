import { Uuid } from '@/common/types/common.type';

export type AiToolFactory = (definition: unknown) => unknown;

export type TaskToolContext = {
  userId: Uuid;
};

export type ToolTodo = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  statusId: string;
  statusName?: string;
  priority?: string;
  dueDate?: Date;
  tags?: string[];
  externalLinks?: unknown;
  aiSummary?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
