import { Uuid } from '@/common/types/common.type';

export type AiToolFactory = (typeof import('ai'))['tool'];

export type TaskToolContext = {
  userId: Uuid;
};

export type ToolProject = {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ToolTodoStatus = {
  id: string;
  projectId: string;
  name: string;
  order: number;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  jiraSyncStatus?: string;
  tags?: string[];
  externalLinks?: unknown;
  aiSummary?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
