import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { JiraIntegrationResDto } from '../dto/jira-integration.res.dto';
import { JiraTestConnectionResDto } from '../dto/jira-test-connection.res.dto';
import {
  JiraTransitionMappingResDto,
  UpsertJiraTransitionMappingsReqDto,
} from '../dto/jira-transition-mapping.dto';
import { JiraTransitionResDto } from '../dto/jira-transition.res.dto';
import { UpsertJiraIntegrationReqDto } from '../dto/upsert-jira-integration.req.dto';
import { JiraIntegrationService } from '../services/jira-integration.service';

@ApiTags('jira-integration')
@Controller({
  path: 'jira-integration',
  version: '1',
})
export class JiraIntegrationController {
  constructor(
    private readonly jiraIntegrationService: JiraIntegrationService,
  ) {}

  @Get('projects/:projectId')
  @ApiAuth({
    type: JiraIntegrationResDto,
    summary: 'Get project Jira integration',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async findOne(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
  ): Promise<JiraIntegrationResDto> {
    return this.jiraIntegrationService.findOne(userId, projectId);
  }

  @Put('projects/:projectId')
  @ApiAuth({
    type: JiraIntegrationResDto,
    summary: 'Create or update project Jira integration',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async upsert(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
    @Body() reqDto: UpsertJiraIntegrationReqDto,
  ): Promise<JiraIntegrationResDto> {
    return this.jiraIntegrationService.upsert(userId, projectId, reqDto);
  }

  @Delete('projects/:projectId')
  @ApiAuth({ summary: 'Delete project Jira integration' })
  @ApiParam({ name: 'projectId', type: 'String' })
  async delete(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
  ): Promise<void> {
    return this.jiraIntegrationService.delete(userId, projectId);
  }

  @Post('projects/:projectId/test')
  @ApiAuth({
    type: JiraTestConnectionResDto,
    summary: 'Test project Jira connection',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async testConnection(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
  ): Promise<JiraTestConnectionResDto> {
    return this.jiraIntegrationService.testConnection(userId, projectId);
  }

  @Get('projects/:projectId/transition-mappings')
  @ApiAuth({
    type: JiraTransitionMappingResDto,
    summary: 'Get todo status to Jira transition mappings',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async findTransitionMappings(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
  ): Promise<JiraTransitionMappingResDto[]> {
    return this.jiraIntegrationService.findTransitionMappings(
      userId,
      projectId,
    );
  }

  @Put('projects/:projectId/transition-mappings')
  @ApiAuth({
    type: JiraTransitionMappingResDto,
    summary: 'Replace todo status to Jira transition mappings',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async upsertTransitionMappings(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
    @Body() reqDto: UpsertJiraTransitionMappingsReqDto,
  ): Promise<JiraTransitionMappingResDto[]> {
    return this.jiraIntegrationService.upsertTransitionMappings(
      userId,
      projectId,
      reqDto,
    );
  }

  @Get('projects/:projectId/issues/:issueKey/transitions')
  @ApiAuth({
    type: JiraTransitionResDto,
    summary: 'Get available Jira transitions for an issue',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  @ApiParam({ name: 'issueKey', type: 'String' })
  async getIssueTransitions(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
    @Param('issueKey') issueKey: string,
  ): Promise<JiraTransitionResDto[]> {
    return this.jiraIntegrationService.getIssueTransitions(
      userId,
      projectId,
      issueKey,
    );
  }
}
