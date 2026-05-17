import { AiIntent } from '../enums/ai-intent.enum';

export const INTENT_TOOL_PERMISSIONS: Record<AiIntent, string[]> = {
  [AiIntent.TASK_CREATE]: ['listProjects', 'listTaskStatuses', 'createTask'],
  [AiIntent.TASK_UPDATE]: [
    'findTasks',
    'getTaskDetails',
    'updateTask',
    'linkJiraIssue',
  ],
  [AiIntent.TASK_DELETE]: ['findTasks', 'getTaskDetails', 'deleteTask'],
  [AiIntent.TASK_SEARCH]: [
    'listProjects',
    'listTaskStatuses',
    'findTasks',
    'getTaskDetails',
  ],
  [AiIntent.PROJECT_MANAGE]: [
    'listProjects',
    'createProject',
    'updateProject',
    'deleteProject',
  ],
  [AiIntent.COMMENT_CREATE]: [
    'findTasks',
    'getTaskDetails',
    'createTaskComment',
  ],
  [AiIntent.COMMENT_SEARCH]: [
    'findTasks',
    'getTaskDetails',
    'listTaskComments',
  ],
  [AiIntent.TAG_MANAGE]: ['findTasks', 'getTaskDetails', 'updateTask'],
  [AiIntent.STATUS_UPDATE]: [
    'findTasks',
    'getTaskDetails',
    'listTaskStatuses',
    'updateTaskStatus',
  ],
  [AiIntent.DASHBOARD_QUERY]: ['getDashboardStats'],
  [AiIntent.TODO_HELP]: [],
  [AiIntent.OUT_OF_SCOPE]: [],
  [AiIntent.AMBIGUOUS]: [],
};
