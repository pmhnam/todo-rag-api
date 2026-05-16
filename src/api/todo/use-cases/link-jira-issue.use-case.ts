import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LinkJiraIssueReqDto } from '../dto/link-jira-issue.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoActivityService } from '../services/todo-activity.service';
import { TodoJiraSyncService } from '../services/todo-jira-sync.service';

@Injectable()
export class LinkJiraIssueUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoJiraSyncService: TodoJiraSyncService,
    private readonly todoActivityService: TodoActivityService,
  ) {}

  async execute(
    id: Uuid,
    userId: Uuid,
    reqDto: LinkJiraIssueReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    const jiraIssueKey = reqDto.jiraIssueKey?.trim().toUpperCase() || null;

    if (!jiraIssueKey) {
      const previousIssueKey = todo.jiraIssueKey;
      todo.jiraIssueKey = null;
      todo.jiraIssueUrl = null;
      todo.jiraSyncStatus = JiraSyncStatus.NOT_LINKED;
      todo.jiraLastSyncedAt = null;
      todo.updatedBy = userId;

      const saved = await this.todoRepository.save(todo);
      this.todoActivityService.record({
        todoId: saved.id,
        userId,
        type: TodoActivityType.JIRA_UNLINKED,
        message: `Unlinked Jira issue${previousIssueKey ? ` ${previousIssueKey}` : ''}`,
        metadata: { previousIssueKey },
      });
      return plainToInstance(TodoResDto, saved);
    }

    todo.jiraIssueKey = jiraIssueKey;
    todo.jiraIssueUrl = todo.projectId
      ? await this.todoJiraSyncService.buildIssueUrl(
          userId,
          todo.projectId,
          todo.jiraIssueKey,
        )
      : null;
    todo.jiraSyncStatus = todo.jiraIssueUrl
      ? JiraSyncStatus.SYNCED
      : JiraSyncStatus.NOT_LINKED;
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);
    this.todoActivityService.record({
      todoId: saved.id,
      userId,
      type: TodoActivityType.JIRA_LINKED,
      message: `Linked Jira issue ${jiraIssueKey}`,
      metadata: { jiraIssueKey, jiraIssueUrl: saved.jiraIssueUrl },
    });
    return plainToInstance(TodoResDto, saved);
  }
}
