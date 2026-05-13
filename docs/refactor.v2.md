Phạm Vi
Chỉ refactor trong src/api/\*\*.
Không đụng:

- src/main.ts
- src/app.module.ts
- src/utils/modules-set.ts
- src/database/\*\*
- src/background/\*\*
- global guards/filters/interceptors ngoài api
  Nếu cần dùng shared types/constants/config hiện có thì chỉ consume, không refactor ngoài api.
  Nguyên Tắc Chung
- Refactor từng module nhỏ, mỗi phase build/test được.
- Không đổi API contract nếu không cần.
- Controller mỏng, service/use case xử lý business.
- DB access gom vào repository/finder classes trong từng module.
- Side effects như RAG indexing, Jira sync, AI summary được tách khỏi CRUD chính.
- Với AI SDK: tạo adapter/provider riêng trong api/rag, không để business service gọi SDK trực tiếp.
  Phase 0: Baseline
  Mục tiêu: có điểm an toàn trước refactor.
  Việc làm:
- Chạy test hiện có cho src/api.
- Ghi nhận endpoint/module đang hoạt động.
- Không đổi behavior.
  Kết quả:
- Biết module nào đang fail sẵn.
- Có baseline để so sánh sau từng phase.
  Phase 1: User Module
  Module: src/api/user
  Lý do làm trước:
- Ít phụ thuộc hơn.
- AuthModule phụ thuộc user/session.
  Refactor:
- Đăng ký UserRepository thật sự trong UserModule nếu đang có file nhưng chưa dùng nhất quán.
- Tách persistence methods:
  - findById
  - findByEmail
  - existsByEmail
  - saveUser
- Không để service gọi TypeORM raw repository rải rác.
- Chuẩn hóa response mapping trong UserService.
  Design pattern:
- Repository Pattern.
- DTO Mapper hoặc static factory nhẹ nếu cần.
  Validation:
- Unit test UserService.
- Controller test hiện có phải pass.
  Phase 2: Auth Module
  Module: src/api/auth
  Vấn đề hiện tại:
- AuthService đang làm quá nhiều việc: login, register, token, session, cache blacklist, email verification.
- Có Active Record usage qua SessionEntity.save(), SessionEntity.delete(), SessionEntity.update(), UserEntity.exists().
  Refactor:
- Tách trong src/api/auth/services:
  - AuthService làm facade.
  - TokenService ký/verify access + refresh token.
  - SessionService quản lý session/hash/blacklist.
  - EmailVerificationService tạo token + enqueue email.
- Dùng UserRepository từ user.
- Tạo SessionRepository trong api/auth hoặc api/user tùy bạn muốn session thuộc auth hay user. Khuyến nghị để trong api/auth/repositories/session.repository.ts.
  Design pattern:
- Facade Pattern cho AuthService.
- Repository Pattern cho session.
- Strategy có thể để sau nếu thêm OAuth/social login.
  Validation:
- Test login/register/refresh/logout.
- Đảm bảo refresh token rotation không đổi behavior.
  Phase 3: Project Module
  Module: src/api/project
  Lý do:
- Project là dependency quan trọng cho Todo/Jira/RAG tools.
- Service hiện tại đơn giản, dễ chuẩn hóa.
  Refactor:
- Tạo ProjectRepository:
  - findOwnedPage
  - findOwnedById
  - saveProject
  - softDeleteOwned
  - existsOwned
- Tạo helper assertProjectOwnership(userId, projectId).
- Chuẩn hóa NotFoundException theo error code nếu project cần i18n/error code thống nhất.
  Design pattern:
- Repository Pattern.
- Guarded ownership query.
  Validation:
- Unit tests cho ownership.
- Project controller/service tests.
  Phase 4: Todo Module - Repository Và Query Layer
  Module: src/api/todo
  Vấn đề hiện tại:
- TodoService đang query DB, validate status, generate AI summary, trigger RAG indexing, sync Jira.
- Logic ownership/status bị lặp với TaskAgentService.
  Refactor bước 1:
- Tạo repositories:
  - TodoRepository
  - TodoStatusRepository
- Tạo methods:
  - findOwnedById(userId, todoId)
  - findOwnedWithStatus(userId, todoId)
  - findBoardTodos(userId, filter)
  - findOwnedStatus(userId, projectId, statusId)
  - resolveOwnedStatusByName(userId, projectId, statusName)
- Không thay đổi logic create/update/delete ngay, chỉ chuyển DB access vào repository.
  Design pattern:
- Repository Pattern.
- Specification/filter object cho list todo.
  Validation:
- Test list/find/create/update/delete không đổi response.
  Phase 5: Todo Module - Use Cases
  Module: src/api/todo
  Refactor bước 2:
- Tách use cases:
  - CreateTodoUseCase
  - UpdateTodoUseCase
  - DeleteTodoUseCase
  - LinkJiraIssueUseCase
  - MoveTodoStatusUseCase
  - CreateTodoStatusUseCase
  - UpdateTodoStatusUseCase
- TodoService có thể giữ làm facade để controller chưa phải đổi nhiều.
- Tách TodoMapper nếu response mapping đang lặp.
  Side effects:
- Tạm giữ gọi trực tiếp IndexingService và JiraIntegrationService, nhưng gom vào services riêng:
  - TodoIndexingService
  - TodoJiraSyncService
  - TodoAiSummaryService
    Design pattern:
- Command/Use Case Pattern.
- Facade Pattern.
- Adapter nhẹ cho side effects.
  Validation:
- Test create/update status move.
- Đảm bảo Jira sync chỉ chạy khi status changed.
- Xóa console.log('syncStatus', syncStatus) khi implement.
  Phase 6: Jira Integration Module
  Module: src/api/jira-integration
  Vấn đề dự kiến:
- Jira integration thường có nhiều logic external API, mapping, encryption, ownership.
- Cần tách client khỏi business orchestration.
  Refactor:
- Tạo repositories:
  - JiraIntegrationRepository
  - JiraStatusMappingRepository
- Tách services:
  - JiraIntegrationService làm facade/use case orchestration.
  - JiraClientService chỉ gọi HTTP API.
  - JiraCredentialService xử lý token/encryption/decryption nếu hiện đang nằm trong entity/service.
  - JiraTransitionMappingService xử lý mapping local status -> Jira transition.
- Không để entity chứa quá nhiều encryption logic nếu có thể chuyển vào credential service, nhưng cần cẩn thận vì có persisted data.
  Design pattern:
- Adapter Pattern cho Jira API.
- Repository Pattern.
- Strategy Pattern cho JiraAuthType nếu sau này có OAuth/API token/basic.
  Validation:
- Mock Jira client.
- Test upsert integration, test connection, sync transition.
  Phase 7: RAG Module - Provider Và AI SDK Layer
  Module: src/api/rag
  Vấn đề hiện tại:
- TaskAgentService gọi AI SDK trực tiếp, dynamic import bằng new Function, có as any.
- Tool definitions và business operations nằm chung một service lớn.
- LlmService/provider abstraction đang tồn tại nhưng TaskAgentService bypass một phần bằng OpenRouter SDK trực tiếp.
  Refactor:
- Tạo src/api/rag/ai hoặc src/api/rag/providers/ai-sdk:
  - AiSdkModelFactory
  - AiTextGenerationService
  - AiToolExecutionService
  - AiSdkErrorMapper
- Chuẩn hóa AI SDK theo Context7:
  - generateText cho chat/tool flow hiện tại.
  - streamText chỉ thêm khi có endpoint streaming.
  - tool({ inputSchema, execute }) cho task tools.
  - Output.object({ schema }) cho output có schema như summary/task extraction.
  - stopWhen/step limit để tránh loop tool calls.
- TaskAgentService không tự tạo OpenRouter client nữa; inject model/generator.
  Design pattern:
- Adapter Pattern cho AI SDK.
- Factory Provider cho model.
- Strategy Pattern cho LLM providers.
  Validation:
- Mock AiTextGenerationService.
- Test agent không cần gọi thật OpenRouter.
  Phase 8: RAG Module - Tools Tách Khỏi Agent
  Module: src/api/rag
  Refactor:
- Tách task tools thành classes/factory:
  - FindTasksTool
  - GetTaskDetailsTool
  - CreateTaskTool
  - UpdateTaskTool
  - UpdateTaskStatusTool
  - TaskToolFactory
- Tool gọi TodoService/use cases thay vì tự query TodoRepository.
- Xóa duplicate logic trong TaskAgentService:
  - findTasks
  - getTaskDetails
  - createTask
  - updateTask
  - updateTaskStatus
  - getOwnedTask
  - getOwnedStatus
  - resolveStatus
  - syncJiraStatusAfterLocalMove
  - reindex
- TaskAgentService chỉ:
  - build messages
  - lấy tools từ factory
  - gọi AI generator
  - trả TaskAgentResponse
    Design pattern:
- Tool Registry.
- Command Pattern thông qua use cases.
- DRY ownership/business rules.
  Validation:
- Test tool schema.
- Test mỗi tool gọi đúng use case.
- Test agent trả toolCalls.
  Phase 9: RAG Module - RAG Pipeline
  Module: src/api/rag
  Refactor:
- Tạo repositories:
  - RagConversationRepository
  - RagMessageRepository
  - EmbeddingSourceRepository
  - EmbeddingChunkRepository
- Tách services:
  - RagConversationService
  - RagMessageService
  - RagPromptBuilder
  - RagQueryUseCase
  - VectorSearchService hoặc giữ SearchService nhưng DB query đưa vào repository.
- Tạo types thay cho any[]:
  - RagContextChunk
  - SearchResultMetadata
  - TaskAgentToolCall
  - EmbeddingMetadata
- RagService thành facade mỏng hoặc bị thay bằng use cases.
  Design pattern:
- Pipeline/Orchestrator Pattern.
- Builder Pattern cho prompt/context.
- Repository Pattern.
  Validation:
- Test query flow với mocked search + agent.
- Test conversation ownership.
- Test save user/assistant messages.
  Phase 10: Post Module
  Module: src/api/post
  Lý do để sau:
- Có vẻ là boilerplate/simple CRUD.
- Refactor sau khi đã có convention từ Project/Todo.
  Refactor:
- Tạo PostRepository.
- Chuẩn hóa service/controller/DTO mapper theo convention đã dùng.
- Nếu không còn dùng trong product, cân nhắc giữ tối thiểu hoặc đánh dấu legacy, nhưng chưa xóa nếu chưa được yêu cầu.
  Design pattern:
- Repository Pattern.
- CRUD facade.
  Validation:
- Existing post tests pass.
  Phase 11: Health Và Home Module
  Modules:
- src/api/health
- src/api/home
  Refactor nhẹ:
- Giữ đơn giản.
- Chỉ cleanup naming/test nếu lệch convention.
- Không áp dụng pattern nặng.
  Validation:
- Controller specs pass.
  Phase 12: ApiModule Composition
  Module: src/api/api.module.ts
  Refactor cuối:
- Đảm bảo import order rõ:
  - foundational: UserModule, AuthModule
  - domain: ProjectModule, TodoModule, JiraIntegrationModule
  - AI/RAG: RagModule
  - utility: HealthModule, HomeModule, PostModule
- Tránh circular dependency:
  - TodoModule cần export facade/use cases cần cho RAG tools.
  - JiraIntegrationModule export service cần cho Todo sync.
  - Nếu TodoModule và RagModule phụ thuộc vòng, dùng event/adapter hoặc tách interface token trong module phù hợp.
    Thứ Tự Implement Khuyến Nghị

1. user
2. auth
3. project
4. todo repository layer
5. todo use cases + side effect services
6. jira-integration
7. rag AI SDK adapter
8. rag task tools
9. rag pipeline/repositories
10. post
11. health/home
12. api.module cleanup
    Commit/PR Strategy

- Mỗi phase là một commit/PR nhỏ.
- Không trộn RAG + Todo + Jira trong cùng commit nếu tránh được.
- Sau mỗi phase chạy:
  - pnpm test
  - test module cụ thể nếu có
  - pnpm build
