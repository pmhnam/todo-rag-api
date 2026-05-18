import { StorageService } from '@/storage/storage.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationModule } from '../jira-integration/jira-integration.module';
import { ProjectModule } from '../project/project.module';
import { RagCoreModule } from '../rag/rag-core.module';
import { TodoActivityController } from './controllers/todo-activity.controller';
import { TodoAttachmentController } from './controllers/todo-attachment.controller';
import { TodoCommentController } from './controllers/todo-comment.controller';
import { TodoStatusController } from './controllers/todo-status.controller';
import { TodoController } from './controllers/todo.controller';
import { TodoActivityEntity } from './entities/todo-activity.entity';
import { TodoAttachmentEntity } from './entities/todo-attachment.entity';
import { TodoCommentEntity } from './entities/todo-comment.entity';
import { TodoStatusEntity } from './entities/todo-status.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodoActivityRepository } from './repositories/todo-activity.repository';
import { TodoAttachmentRepository } from './repositories/todo-attachment.repository';
import { TodoCommentRepository } from './repositories/todo-comment.repository';
import { TodoStatusRepository } from './repositories/todo-status.repository';
import { TodoRepository } from './repositories/todo.repository';
import { TodoActivityService } from './services/todo-activity.service';
import { TodoAiSummaryService } from './services/todo-ai-summary.service';
import { TodoIndexingService } from './services/todo-indexing.service';
import { TodoJiraSyncService } from './services/todo-jira-sync.service';
import { TodoStatusService } from './services/todo-status.service';
import { TodoService } from './services/todo.service';
import { CompleteTodoAttachmentUseCase } from './use-cases/complete-todo-attachment.use-case';
import { CountTasksUseCase } from './use-cases/count-tasks.use-case';
import { CreateTodoCommentUseCase } from './use-cases/create-todo-comment.use-case';
import { CreateTodoStatusUseCase } from './use-cases/create-todo-status.use-case';
import { CreateTodoUseCase } from './use-cases/create-todo.use-case';
import { DeleteTodoAttachmentUseCase } from './use-cases/delete-todo-attachment.use-case';
import { DeleteTodoCommentUseCase } from './use-cases/delete-todo-comment.use-case';
import { DeleteTodoStatusUseCase } from './use-cases/delete-todo-status.use-case';
import { DeleteTodoUseCase } from './use-cases/delete-todo.use-case';
import { FindAgentTodosUseCase } from './use-cases/find-agent-todos.use-case';
import { FindTodoActivitiesUseCase } from './use-cases/find-todo-activities.use-case';
import { FindTodoCommentsUseCase } from './use-cases/find-todo-comments.use-case';
import { FindTodoStatusesUseCase } from './use-cases/find-todo-statuses.use-case';
import { FindTodosUseCase } from './use-cases/find-todos.use-case';
import { GetDashboardStatsUseCase } from './use-cases/get-dashboard-stats.use-case';
import { GetTodoDetailUseCase } from './use-cases/get-todo-detail.use-case';
import { GetTodoStatusDetailUseCase } from './use-cases/get-todo-status-detail.use-case';
import { LinkJiraIssueUseCase } from './use-cases/link-jira-issue.use-case';
import { PresignTodoAttachmentUseCase } from './use-cases/presign-todo-attachment.use-case';
import { ReorderTodosUseCase } from './use-cases/reorder-todos.use-case';
import { ResolveTodoStatusUseCase } from './use-cases/resolve-todo-status.use-case';
import { UpdateTodoCommentUseCase } from './use-cases/update-todo-comment.use-case';
import { UpdateTodoStatusUseCase } from './use-cases/update-todo-status.use-case';
import { UpdateTodoUseCase } from './use-cases/update-todo.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TodoEntity,
      TodoStatusEntity,
      TodoCommentEntity,
      TodoAttachmentEntity,
      TodoActivityEntity,
    ]),
    RagCoreModule,
    JiraIntegrationModule,
    ProjectModule,
  ],
  controllers: [
    TodoController,
    TodoStatusController,
    TodoCommentController,
    TodoAttachmentController,
    TodoActivityController,
  ],
  providers: [
    TodoService,
    TodoStatusService,
    TodoRepository,
    TodoStatusRepository,
    TodoCommentRepository,
    TodoAttachmentRepository,
    TodoActivityRepository,
    StorageService,
    TodoActivityService,
    TodoAiSummaryService,
    TodoIndexingService,
    TodoJiraSyncService,
    FindTodosUseCase,
    GetTodoDetailUseCase,
    CreateTodoUseCase,
    CountTasksUseCase,
    UpdateTodoUseCase,
    LinkJiraIssueUseCase,
    DeleteTodoUseCase,
    FindAgentTodosUseCase,
    FindTodoStatusesUseCase,
    GetTodoStatusDetailUseCase,
    CreateTodoStatusUseCase,
    UpdateTodoStatusUseCase,
    DeleteTodoStatusUseCase,
    ReorderTodosUseCase,
    ResolveTodoStatusUseCase,
    FindTodoCommentsUseCase,
    CreateTodoCommentUseCase,
    PresignTodoAttachmentUseCase,
    CompleteTodoAttachmentUseCase,
    DeleteTodoAttachmentUseCase,
    UpdateTodoCommentUseCase,
    DeleteTodoCommentUseCase,
    FindTodoActivitiesUseCase,
    GetDashboardStatsUseCase,
  ],
  exports: [
    TodoStatusService,
    FindTodosUseCase,
    GetTodoDetailUseCase,
    CreateTodoUseCase,
    CountTasksUseCase,
    UpdateTodoUseCase,
    LinkJiraIssueUseCase,
    DeleteTodoUseCase,
    FindAgentTodosUseCase,
    FindTodoStatusesUseCase,
    CreateTodoStatusUseCase,
    UpdateTodoStatusUseCase,
    DeleteTodoStatusUseCase,
    ReorderTodosUseCase,
    ResolveTodoStatusUseCase,
    FindTodoCommentsUseCase,
    CreateTodoCommentUseCase,
    GetDashboardStatsUseCase,
  ],
})
export class TodoModule {}
