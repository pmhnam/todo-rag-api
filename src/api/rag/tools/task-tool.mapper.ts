import { TodoEntity } from '@/api/todo/entities/todo.entity';

export function toToolTodo(todo: TodoEntity, includeDetails = false) {
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
