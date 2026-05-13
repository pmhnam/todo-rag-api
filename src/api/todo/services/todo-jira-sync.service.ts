import { JiraIntegrationService } from '@/api/jira-integration/services/jira-integration.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { TodoEntity } from '../entities/todo.entity';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable()
export class TodoJiraSyncService {
  private readonly logger = new Logger(TodoJiraSyncService.name);

  constructor(
    private readonly jiraIntegrationService: JiraIntegrationService,
    private readonly todoRepository: TodoRepository,
  ) {}

  async syncStatusAfterLocalMove(
    userId: Uuid,
    todo: TodoEntity,
  ): Promise<void> {
    try {
      const syncStatus =
        await this.jiraIntegrationService.syncTodoStatusTransition(
          userId,
          todo,
        );
      if (!syncStatus) return;

      todo.jiraSyncStatus = syncStatus;
      todo.jiraLastSyncedAt =
        syncStatus === JiraSyncStatus.SYNCED
          ? new Date()
          : todo.jiraLastSyncedAt;
      await this.todoRepository.save(todo);
    } catch (err) {
      todo.jiraSyncStatus = JiraSyncStatus.FAILED;
      await this.todoRepository.save(todo);
      this.logger.warn(
        `Failed to sync Jira transition for todo ${todo.id}: ${err.message}`,
      );
    }
  }

  buildIssueUrl(
    userId: Uuid,
    projectId: Uuid,
    issueKey: string,
  ): Promise<string | null> {
    return this.jiraIntegrationService.buildIssueUrl(
      userId,
      projectId,
      issueKey,
    );
  }
}
