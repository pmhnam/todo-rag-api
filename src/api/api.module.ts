import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { JiraIntegrationModule } from './jira-integration/jira-integration.module';
import { PostModule } from './post/post.module';
import { ProjectModule } from './project/project.module';
import { RagModule } from './rag/rag.module';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // Foundational
    UserModule,
    AuthModule,

    // Domain
    ProjectModule,
    TodoModule,
    JiraIntegrationModule,

    // AI/RAG
    RagModule,

    // Utility
    HealthModule,
    HomeModule,
    PostModule,
  ],
})
export class ApiModule {}
