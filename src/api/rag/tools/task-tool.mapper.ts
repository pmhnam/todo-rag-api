import { ProjectResDto } from '@/api/project/dto/project.res.dto';
import { TodoStatusResDto } from '@/api/todo/dto/todo-status.res.dto';
import { TodoResDto } from '@/api/todo/dto/todo.res.dto';
import { TodoEntity } from '@/api/todo/entities/todo.entity';

type ToolTodoSource = TodoEntity | TodoResDto;

export function toToolTodo(todo: ToolTodoSource, includeDetails = false) {
  return {
    id: todo.id,
    projectId: todo.projectId,
    title: todo.title,
    description: includeDetails ? todo.description : undefined,
    statusId: todo.statusId,
    statusName: todo.status?.name,
    priority: todo.priority,
    dueDate: todo.dueDate,
    jiraIssueKey: todo.jiraIssueKey,
    jiraIssueUrl: todo.jiraIssueUrl,
    jiraSyncStatus: todo.jiraSyncStatus,
    tags: todo.tags,
    externalLinks: includeDetails ? todo.externalLinks : undefined,
    aiSummary: includeDetails ? todo.aiSummary : undefined,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

export function toToolProject(project: ProjectResDto) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toToolTodoStatus(status: TodoStatusResDto) {
  return {
    id: status.id,
    projectId: status.projectId,
    name: status.name,
    order: status.order,
    color: status.color,
    createdAt: status.createdAt,
    updatedAt: status.updatedAt,
  };
}
