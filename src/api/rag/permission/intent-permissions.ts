import { AiIntent } from '../enums/ai-intent.enum';

export const READ_TOOLS = {
  PROJECT: ['listProjects'],
  STATUS: ['listTaskStatuses'],
  TASK: ['findTasks', 'getTaskDetails', 'countTasks'],
  COMMENT: ['listTaskComments'],
  DASHBOARD: ['getDashboardStats', 'countTasks'],
} as const;

export const WRITE_TOOLS = {
  PROJECT: ['createProject', 'updateProject', 'deleteProject'],
  STATUS: [
    'createTaskStatus',
    'updateTaskStatusDefinition',
    'deleteTaskStatus',
  ],
  TASK: ['createTask', 'updateTask', 'deleteTask', 'updateTaskStatus'],
  COMMENT: ['createTaskComment'],
  JIRA: ['linkJiraIssue'],
} as const;

export const INTENT_TOOL_PERMISSIONS: Record<AiIntent, string[]> = {
  [AiIntent.TASK_CREATE]: [
    ...READ_TOOLS.PROJECT,
    ...READ_TOOLS.STATUS,
    'createTask',
  ],
  [AiIntent.TASK_UPDATE]: [...READ_TOOLS.TASK, 'updateTask', 'linkJiraIssue'],
  [AiIntent.TASK_DELETE]: [...READ_TOOLS.TASK, 'deleteTask'],
  [AiIntent.TASK_SEARCH]: [
    ...READ_TOOLS.PROJECT,
    ...READ_TOOLS.STATUS,
    ...READ_TOOLS.TASK,
  ],
  [AiIntent.PROJECT_MANAGE]: [...READ_TOOLS.PROJECT, ...WRITE_TOOLS.PROJECT],
  [AiIntent.COMMENT_CREATE]: [...READ_TOOLS.TASK, 'createTaskComment'],
  [AiIntent.COMMENT_SEARCH]: [...READ_TOOLS.TASK, ...READ_TOOLS.COMMENT],
  [AiIntent.TAG_MANAGE]: [...READ_TOOLS.TASK, 'updateTask'],
  [AiIntent.STATUS_UPDATE]: [
    ...READ_TOOLS.TASK,
    ...READ_TOOLS.STATUS,
    'updateTaskStatus',
  ],
  [AiIntent.DASHBOARD_QUERY]: [
    ...READ_TOOLS.PROJECT,
    ...READ_TOOLS.STATUS,
    ...READ_TOOLS.DASHBOARD,
  ],
  [AiIntent.STANDUP_REPORT]: [
    ...READ_TOOLS.PROJECT,
    ...READ_TOOLS.STATUS,
    'findTasks',
    'getTaskDetails',
    ...READ_TOOLS.DASHBOARD,
  ],
  [AiIntent.TODO_HELP]: [],
  [AiIntent.OUT_OF_SCOPE]: [],
  [AiIntent.AMBIGUOUS]: [],
};
