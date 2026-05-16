import { Injectable } from '@nestjs/common';

export type TaskIntent =
  | 'TODO_CREATE'
  | 'TODO_UPDATE'
  | 'TODO_DELETE'
  | 'TODO_SEARCH'
  | 'TODO_SUMMARY'
  | 'OUT_OF_SCOPE';

@Injectable()
export class TaskIntentClassifierService {
  classify(message: string): TaskIntent {
    const normalized = this.normalize(message);

    if (!normalized) return 'OUT_OF_SCOPE';

    const createIntent = this.hasAny(normalized, [
      'tao',
      'them',
      'lap',
      'nhac',
      'add',
      'create',
      'new',
      'remind',
      'reminder',
    ]);
    const updateIntent = this.hasAny(normalized, [
      'sua',
      'cap nhat',
      'doi',
      'chuyen',
      'move',
      'update',
      'edit',
      'rename',
      'link',
      'unlink',
      'jira',
    ]);
    const deleteIntent = this.hasAny(normalized, [
      'xoa',
      'delete',
      'remove',
      'huy',
    ]);
    const searchIntent = this.hasAny(normalized, [
      'tim',
      'liet ke',
      'xem',
      'show',
      'find',
      'search',
      'list',
      'loc',
      'filter',
      'chi tiet',
      'tinh trang',
    ]);
    const summaryIntent = this.hasAny(normalized, [
      'tom tat',
      'tong hop',
      'phan tich',
      'lich su',
      'summary',
      'summarize',
      'history',
      'analyze',
      'report',
    ]);

    const taskDomain = this.hasAny(normalized, [
      'todo',
      'task',
      'cong viec',
      'viec can lam',
      'nhac viec',
      'deadline',
      'due date',
      'priority',
      'uu tien',
      'project',
      'board',
      'status',
      'column',
      'cot',
      'trang thai',
      'jira',
      'rag',
    ]);

    if (deleteIntent && taskDomain) return 'TODO_DELETE';
    if (createIntent && taskDomain) return 'TODO_CREATE';
    if (updateIntent && taskDomain) return 'TODO_UPDATE';
    if (searchIntent && taskDomain) return 'TODO_SEARCH';
    if (summaryIntent && taskDomain) return 'TODO_SUMMARY';

    if (this.isOutOfScope(normalized)) return 'OUT_OF_SCOPE';

    if (deleteIntent) return 'TODO_DELETE';
    if (createIntent) return 'TODO_CREATE';
    if (updateIntent) return 'TODO_UPDATE';
    if (searchIntent) return 'TODO_SEARCH';
    if (summaryIntent) return 'TODO_SUMMARY';

    return taskDomain ? 'TODO_SEARCH' : 'OUT_OF_SCOPE';
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s#/_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isOutOfScope(message: string): boolean {
    return this.hasAny(message, [
      'html',
      'css',
      'javascript',
      'js',
      'typescript',
      'python',
      'java',
      'code',
      'viet code',
      'lap trinh',
      'dich',
      'translate',
      'viet bai',
      'essay',
      'blog',
      'lam toan',
      'giai toan',
      'calculate',
      'giai thich',
      'explain',
      'tu van',
      'advice',
    ]);
  }

  private hasAny(message: string, keywords: string[]): boolean {
    return keywords.some((keyword) => message.includes(keyword));
  }
}
