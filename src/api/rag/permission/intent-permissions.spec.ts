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
});
