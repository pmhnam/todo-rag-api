import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationEntity } from './entities/jira-integration.entity';
import { JiraStatusMappingEntity } from './entities/jira-status-mapping.entity';

/**
 * JiraIntegrationModule
 *
 * Currently only registers entities for TypeORM (migrations/schema).
 * Full API implementation (controller + service) will be added in the Jira integration feature.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([JiraIntegrationEntity, JiraStatusMappingEntity]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class JiraIntegrationModule {}
