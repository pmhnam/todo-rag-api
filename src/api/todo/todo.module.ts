import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationModule } from '../jira-integration/jira-integration.module';
import { RagCoreModule } from '../rag/rag-core.module';
import { TodoStatusController } from './controllers/todo-status.controller';
import { TodoController } from './controllers/todo.controller';
import { TodoStatusEntity } from './entities/todo-status.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodoStatusRepository } from './repositories/todo-status.repository';
import { TodoRepository } from './repositories/todo.repository';
import { TodoAiSummaryService } from './services/todo-ai-summary.service';
import { TodoIndexingService } from './services/todo-indexing.service';
import { TodoJiraSyncService } from './services/todo-jira-sync.service';
import { TodoStatusService } from './services/todo-status.service';
import { TodoService } from './services/todo.service';
import { CreateTodoStatusUseCase } from './use-cases/create-todo-status.use-case';
import { CreateTodoUseCase } from './use-cases/create-todo.use-case';
import { DeleteTodoStatusUseCase } from './use-cases/delete-todo-status.use-case';
import { DeleteTodoUseCase } from './use-cases/delete-todo.use-case';
import { FindAgentTodosUseCase } from './use-cases/find-agent-todos.use-case';
import { FindTodoStatusesUseCase } from './use-cases/find-todo-statuses.use-case';
import { FindTodosUseCase } from './use-cases/find-todos.use-case';
import { GetTodoDetailUseCase } from './use-cases/get-todo-detail.use-case';
import { GetTodoStatusDetailUseCase } from './use-cases/get-todo-status-detail.use-case';
import { LinkJiraIssueUseCase } from './use-cases/link-jira-issue.use-case';
import { ResolveTodoStatusUseCase } from './use-cases/resolve-todo-status.use-case';
import { UpdateTodoStatusUseCase } from './use-cases/update-todo-status.use-case';
import { UpdateTodoUseCase } from './use-cases/update-todo.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoEntity, TodoStatusEntity]),
    RagCoreModule,
    JiraIntegrationModule,
  ],
  controllers: [TodoController, TodoStatusController],
  providers: [
    TodoService,
    TodoStatusService,
    TodoRepository,
    TodoStatusRepository,
    TodoAiSummaryService,
    TodoIndexingService,
    TodoJiraSyncService,
    FindTodosUseCase,
    GetTodoDetailUseCase,
    CreateTodoUseCase,
    UpdateTodoUseCase,
    LinkJiraIssueUseCase,
    DeleteTodoUseCase,
    FindAgentTodosUseCase,
    FindTodoStatusesUseCase,
    GetTodoStatusDetailUseCase,
    CreateTodoStatusUseCase,
    UpdateTodoStatusUseCase,
    DeleteTodoStatusUseCase,
    ResolveTodoStatusUseCase,
  ],
  exports: [
    TodoStatusService,
    FindTodosUseCase,
    GetTodoDetailUseCase,
    CreateTodoUseCase,
    UpdateTodoUseCase,
    FindAgentTodosUseCase,
    FindTodoStatusesUseCase,
    ResolveTodoStatusUseCase,
  ],
})
export class TodoModule {}
