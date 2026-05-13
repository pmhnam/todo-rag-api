import { ProjectEntity } from '@/api/project/entities/project.entity';
import { TodoStatusEntity } from '@/api/todo/entities/todo-status.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { JiraSyncStatus } from '@/api/todo/enums/jira-sync-status.enum';
import { Uuid } from '@/common/types/common.type';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, Repository } from 'typeorm';
import { JiraIntegrationResDto } from '../dto/jira-integration.res.dto';
import { JiraTestConnectionResDto } from '../dto/jira-test-connection.res.dto';
import {
  JiraTransitionMappingResDto,
  UpsertJiraTransitionMappingsReqDto,
} from '../dto/jira-transition-mapping.dto';
import { JiraTransitionResDto } from '../dto/jira-transition.res.dto';
import { UpsertJiraIntegrationReqDto } from '../dto/upsert-jira-integration.req.dto';
import { JiraIntegrationEntity } from '../entities/jira-integration.entity';
import { JiraStatusMappingEntity } from '../entities/jira-status-mapping.entity';
import { JiraAuthType } from '../enums/jira-auth-type.enum';
import { JiraClientService } from './jira-client.service';

@Injectable()
export class JiraIntegrationService {
  constructor(
    @InjectRepository(JiraIntegrationEntity)
    private readonly jiraIntegrationRepository: Repository<JiraIntegrationEntity>,
    @InjectRepository(JiraStatusMappingEntity)
    private readonly jiraStatusMappingRepository: Repository<JiraStatusMappingEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(TodoStatusEntity)
    private readonly todoStatusRepository: Repository<TodoStatusEntity>,
    private readonly jiraClientService: JiraClientService,
  ) {}

  async findOne(userId: Uuid, projectId: Uuid): Promise<JiraIntegrationResDto> {
    await this.validateProjectBelongsToUser(userId, projectId);
    const integration = await this.findIntegrationByProjectId(
      userId,
      projectId,
    );
    if (!integration) {
      throw new NotFoundException('Jira integration is not configured');
    }

    return plainToInstance(JiraIntegrationResDto, integration);
  }

  async upsert(
    userId: Uuid,
    projectId: Uuid,
    reqDto: UpsertJiraIntegrationReqDto,
  ): Promise<JiraIntegrationResDto> {
    await this.validateProjectBelongsToUser(userId, projectId);

    const existing = await this.findIntegrationByProjectId(userId, projectId);
    this.validateAuthConfig(reqDto, !!existing);
    const integration = existing || new JiraIntegrationEntity();

    Object.assign(integration, {
      jiraDomain: this.normalizeDomain(reqDto.jiraDomain),
      jiraEmail:
        reqDto.authType === JiraAuthType.BASIC ? reqDto.jiraEmail : null,
      authType: reqDto.authType,
      jiraProjectKey: reqDto.jiraProjectKey,
      userId,
      projectId,
      createdBy: existing?.createdBy || userId,
      updatedBy: userId,
    });

    if (reqDto.jiraApiToken) {
      integration.jiraApiToken = reqDto.jiraApiToken;
    }

    const saved = await this.jiraIntegrationRepository.save(integration);
    return plainToInstance(JiraIntegrationResDto, saved);
  }

  async delete(userId: Uuid, projectId: Uuid): Promise<void> {
    await this.validateProjectBelongsToUser(userId, projectId);
    const integration = await this.findIntegrationByProjectId(
      userId,
      projectId,
    );
    if (!integration) return;

    await this.jiraIntegrationRepository.softDelete(integration.id);
  }

  async testConnection(
    userId: Uuid,
    projectId: Uuid,
  ): Promise<JiraTestConnectionResDto> {
    const integration = await this.requireIntegration(userId, projectId);
    const jiraUser = await this.jiraClientService.getCurrentUser(integration);

    return plainToInstance(JiraTestConnectionResDto, {
      success: true,
      accountId: jiraUser?.accountId || jiraUser?.name,
      displayName: jiraUser?.displayName,
    });
  }

  async findTransitionMappings(
    userId: Uuid,
    projectId: Uuid,
  ): Promise<JiraTransitionMappingResDto[]> {
    const integration = await this.requireIntegration(userId, projectId);
    const mappings = await this.jiraStatusMappingRepository.find({
      where: { jiraIntegrationId: integration.id },
      order: { createdAt: 'ASC' },
    });

    return plainToInstance(JiraTransitionMappingResDto, mappings);
  }

  async upsertTransitionMappings(
    userId: Uuid,
    projectId: Uuid,
    reqDto: UpsertJiraTransitionMappingsReqDto,
  ): Promise<JiraTransitionMappingResDto[]> {
    const integration = await this.requireIntegration(userId, projectId);
    const requestedMappings = reqDto.mappings || [];
    const todoStatusIds = requestedMappings.map(
      (mapping) => mapping.todoStatusId as Uuid,
    );

    if (new Set(todoStatusIds).size !== todoStatusIds.length) {
      throw new BadRequestException(
        'Duplicate todo status mappings are invalid',
      );
    }

    await this.validateTodoStatusesBelongToProject(
      userId,
      projectId,
      todoStatusIds,
    );

    const existingMappings = await this.jiraStatusMappingRepository.find({
      where: { jiraIntegrationId: integration.id },
    });
    const existingByStatusId = new Map(
      existingMappings.map((mapping) => [mapping.todoStatusId, mapping]),
    );

    const savedMappings = await this.jiraStatusMappingRepository.save(
      requestedMappings.map((mapping) => {
        const existing = existingByStatusId.get(mapping.todoStatusId as Uuid);
        return this.jiraStatusMappingRepository.create({
          ...existing,
          todoStatusId: mapping.todoStatusId as Uuid,
          jiraTransitionId: mapping.jiraTransitionId,
          jiraTransitionName: mapping.jiraTransitionName,
          jiraIntegrationId: integration.id,
          createdBy: existing?.createdBy || userId,
          updatedBy: userId,
        });
      }),
    );

    const requestedStatusIdSet = new Set(todoStatusIds);
    const removedMappingIds = existingMappings
      .filter((mapping) => !requestedStatusIdSet.has(mapping.todoStatusId))
      .map((mapping) => mapping.id);

    if (removedMappingIds.length > 0) {
      await this.jiraStatusMappingRepository.softDelete(removedMappingIds);
    }

    return plainToInstance(JiraTransitionMappingResDto, savedMappings);
  }

  async getIssueTransitions(
    userId: Uuid,
    projectId: Uuid,
    issueKey: string,
  ): Promise<JiraTransitionResDto[]> {
    const integration = await this.requireIntegration(userId, projectId);
    const transitions = await this.jiraClientService.getIssueTransitions(
      integration,
      issueKey,
    );

    return plainToInstance(
      JiraTransitionResDto,
      transitions.map((transition) => ({
        id: transition.id,
        name: transition.name,
        toStatusId: transition.to?.id,
        toStatusName: transition.to?.name,
      })),
    );
  }

  async syncTodoStatusTransition(
    userId: Uuid,
    todo: TodoEntity,
  ): Promise<JiraSyncStatus | null> {
    if (!todo.jiraIssueKey) {
      return JiraSyncStatus.NOT_LINKED;
    }

    if (!todo.projectId) return null;

    const integration = await this.findIntegrationByProjectId(
      userId,
      todo.projectId,
    );
    if (!integration) return JiraSyncStatus.PENDING;

    const mapping = await this.jiraStatusMappingRepository.findOne({
      where: {
        jiraIntegrationId: integration.id,
        todoStatusId: todo.statusId,
      },
    });

    if (!mapping) return JiraSyncStatus.PENDING;

    await this.jiraClientService.transitionIssue(
      integration,
      todo.jiraIssueKey,
      mapping.jiraTransitionId,
    );

    return JiraSyncStatus.SYNCED;
  }

  async buildIssueUrl(
    userId: Uuid,
    projectId: Uuid,
    issueKey: string,
  ): Promise<string | null> {
    const integration = await this.findIntegrationByProjectId(
      userId,
      projectId,
    );
    if (!integration) return null;

    return `${this.normalizeDomain(integration.jiraDomain)}/browse/${encodeURIComponent(issueKey)}`;
  }

  private async requireIntegration(
    userId: Uuid,
    projectId: Uuid,
  ): Promise<JiraIntegrationEntity> {
    await this.validateProjectBelongsToUser(userId, projectId);
    const integration = await this.findIntegrationByProjectId(
      userId,
      projectId,
    );
    if (!integration) {
      throw new NotFoundException('Jira integration is not configured');
    }

    return integration;
  }

  private findIntegrationByProjectId(
    userId: Uuid,
    projectId: Uuid,
  ): Promise<JiraIntegrationEntity | null> {
    return this.jiraIntegrationRepository.findOne({
      where: { userId, projectId },
    });
  }

  private validateAuthConfig(
    reqDto: UpsertJiraIntegrationReqDto,
    hasExistingIntegration: boolean,
  ): void {
    if (reqDto.authType === JiraAuthType.BASIC && !reqDto.jiraEmail) {
      throw new BadRequestException('jiraEmail is required for BASIC auth');
    }

    if (!hasExistingIntegration && !reqDto.jiraApiToken) {
      throw new BadRequestException('jiraApiToken is required');
    }
  }

  private async validateProjectBelongsToUser(
    userId: Uuid,
    projectId: Uuid,
  ): Promise<void> {
    const exists = await this.projectRepository.exists({
      where: { id: projectId, userId },
    });

    if (!exists) {
      throw new NotFoundException('Project not found');
    }
  }

  private async validateTodoStatusesBelongToProject(
    userId: Uuid,
    projectId: Uuid,
    todoStatusIds: Uuid[],
  ): Promise<void> {
    if (todoStatusIds.length === 0) return;

    const uniqueStatusIds = [...new Set(todoStatusIds)];
    const count = await this.todoStatusRepository.count({
      where: {
        id: In(uniqueStatusIds),
        userId,
        projectId,
      },
    });

    if (count !== uniqueStatusIds.length) {
      throw new BadRequestException('One or more todo statuses are invalid');
    }
  }

  private normalizeDomain(domain: string): string {
    return domain.replace(/\/+$/, '');
  }
}
