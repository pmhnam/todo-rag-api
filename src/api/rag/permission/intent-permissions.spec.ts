import { AiIntent } from '../enums/ai-intent.enum';
import { INTENT_TOOL_PERMISSIONS } from './intent-permissions';

describe('INTENT_TOOL_PERMISSIONS', () => {
  it('does not allow tools for blocked or ambiguous intents', () => {
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.OUT_OF_SCOPE]).toEqual([]);
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.AMBIGUOUS]).toEqual([]);
  });

  it('allows only create task path for TASK_CREATE', () => {
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.TASK_CREATE]).toEqual([
      'listProjects',
      'listTaskStatuses',
      'createTask',
    ]);
  });

  it('does not grant deleteTask to TASK_SEARCH', () => {
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.TASK_SEARCH]).not.toContain(
      'deleteTask',
    );
  });

  it('allows dashboard read-only aggregate tools', () => {
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.DASHBOARD_QUERY]).toEqual([
      'listProjects',
      'listTaskStatuses',
      'getDashboardStats',
      'countTasks',
    ]);
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.DASHBOARD_QUERY]).not.toContain(
      'updateTask',
    );
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.DASHBOARD_QUERY]).not.toContain(
      'deleteTask',
    );
  });

  it('allows standup report read-only tools', () => {
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.STANDUP_REPORT]).toEqual([
      'listProjects',
      'listTaskStatuses',
      'findTasks',
      'getTaskDetails',
      'getDashboardStats',
      'countTasks',
    ]);
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.STANDUP_REPORT]).not.toContain(
      'createTask',
    );
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.STANDUP_REPORT]).not.toContain(
      'updateTask',
    );
    expect(INTENT_TOOL_PERMISSIONS[AiIntent.STANDUP_REPORT]).not.toContain(
      'deleteTask',
    );
  });
});
