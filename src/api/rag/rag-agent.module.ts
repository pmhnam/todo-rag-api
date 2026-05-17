import { ProjectModule } from '@/api/project/project.module';
import { TodoModule } from '@/api/todo/todo.module';
import { Module } from '@nestjs/common';
import { AiSdkService } from './ai/ai-sdk.service';
import { TaskAgentService } from './services/task-agent.service';
import { TaskToolFactory } from './tools/task-tool.factory';

@Module({
  imports: [TodoModule, ProjectModule],
  providers: [AiSdkService, TaskAgentService, TaskToolFactory],
  exports: [TaskAgentService],
})
export class RagAgentModule {}
