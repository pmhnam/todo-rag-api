import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { JiraIntegrationModule } from './jira-integration/jira-integration.module';
import { PostModule } from './post/post.module';
import { RagModule } from './rag/rag.module';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    HealthModule,
    AuthModule,
    HomeModule,
    PostModule,
    TodoModule,
    JiraIntegrationModule,
    RagModule,
  ],
})
export class ApiModule {}
