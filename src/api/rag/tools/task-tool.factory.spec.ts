import { TaskToolFactory } from './task-tool.factory';

describe('TaskToolFactory', () => {
  function createFactory() {
    return new TaskToolFactory(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  }

  it('filters tools to the allowed set', () => {
    const factory = createFactory();
    const tool = jest.fn((definition) => definition);

    const tools = factory.createTools(
      tool,
      { userId: '00000000-0000-0000-0000-000000000000' as any },
      ['findTasks', 'getTaskDetails'],
    );

    expect(Object.keys(tools).sort()).toEqual(['findTasks', 'getTaskDetails']);
    expect(tools).not.toHaveProperty('deleteTask');
    expect(tools).not.toHaveProperty('createTask');
  });
});
