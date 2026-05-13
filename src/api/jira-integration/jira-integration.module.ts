import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../project/entities/project.entity';
import { TodoStatusEntity } from '../todo/entities/todo-status.entity';
import { JiraIntegrationController } from './controllers/jira-integration.controller';
import { JiraIntegrationEntity } from './entities/jira-integration.entity';
import { JiraStatusMappingEntity } from './entities/jira-status-mapping.entity';
import { JiraClientService } from './services/jira-client.service';
import { JiraIntegrationService } from './services/jira-integration.service';

/**
 * JiraIntegrationModule
 *
 * Project-scoped Jira configuration, transition mappings, and Jira API calls.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      JiraIntegrationEntity,
      JiraStatusMappingEntity,
      ProjectEntity,
      TodoStatusEntity,
    ]),
  ],
  controllers: [JiraIntegrationController],
  providers: [JiraIntegrationService, JiraClientService],
  exports: [JiraIntegrationService],
})
export class JiraIntegrationModule {}
