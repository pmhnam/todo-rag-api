Mục Tiêu Refactor
Refactor dự án theo hướng modular, testable, dễ mở rộng provider AI/RAG/Jira/Todo mà không làm vỡ behavior hiện tại. Ưu tiên thay đổi theo từng phase nhỏ, có test sau mỗi phase.
Hiện Trạng Chính

- Dự án là NestJS + TypeORM + BullMQ + Redis cache + RAG + AI SDK/OpenRouter.
- src/utils/modules-set.ts đang gom quá nhiều module infrastructure vào một function, khó test và khó mở rộng.
- Các service như TodoService, TaskAgentService, RagService, AuthService đang trộn nhiều trách nhiệm: business logic, persistence, AI call, indexing, Jira sync, response mapping.
- Đã có một số pattern tốt: feature modules, DTOs, global ValidationPipe, exception filter, injection token cho LLM/Embedding provider.
- AI SDK đang dùng trong TaskAgentService, nhưng còn dynamic import bằng new Function, as any, tool definitions nằm trong service lớn, khó test/mở rộng.
- TypeORM đang dùng lẫn Repository injection và Active Record (Entity.save(), Entity.exists(), SessionEntity.delete()), nên khó mock và dễ lệch convention.
  Plan Refactor Theo Phase
  Phase 1: Chuẩn Hóa App Bootstrap Và Infrastructure
- Tách generateModulesSet() thành CoreModule hoặc các module rõ ràng:
  - ConfigCoreModule
  - DatabaseModule
  - CacheCoreModule
  - QueueCoreModule
  - LoggerCoreModule
  - I18nCoreModule
- Giữ AppModule chỉ import CoreModule, ApiModule, BackgroundModule theo cấu hình.
- Đưa global providers vào DI thay vì new trực tiếp trong main.ts:
  - APP_GUARD cho AuthGuard
  - APP_FILTER cho GlobalExceptionFilter
  - APP_INTERCEPTOR cho serialization/logging/response transform nếu cần
  - APP_PIPE cho ValidationPipe
- Thay console.info/error/log bằng Logger hoặc nestjs-pino.
- Bật enableShutdownHooks() cho graceful shutdown.
- Giữ helmet, compression, CORS, versioning trong bootstrap nhưng cấu hình từ typed config.
  Phase 2: Config Validation Và Typed Config
- Mở rộng validation cho llm.config.ts, ollama.config.ts, Redis, mail, auth.
- Với AI/RAG config, validate:
  - LLM_PROVIDER: openrouter | ollama | openai
  - EMBEDDING_PROVIDER: gemini | ollama | openai
  - API key bắt buộc theo provider được chọn.
  - LLM_MAX_TOKENS, LLM_TEMPERATURE range hợp lệ.
- Chuẩn hóa config access bằng ConfigType<typeof xxxConfig> khi inject namespace config thay vì dùng string path ở nhiều nơi.
- Tách secrets/URLs/model names ra config object để provider không đọc env trực tiếp.
  Phase 3: Repository Pattern Cho Persistence
- Không dùng Active Record trên entity trong service nữa.
- Tạo repository/domain store theo feature:
  - UserRepository
  - SessionRepository
  - TodoRepository
  - TodoStatusRepository
  - ProjectRepository
  - RagConversationRepository
  - RagMessageRepository
  - EmbeddingSourceRepository
  - EmbeddingChunkRepository
  - JiraIntegrationRepository
- Service chỉ gọi method business-friendly:
  - todoRepository.findOwnedById(userId, todoId)
  - todoRepository.findBoardTasks(userId, filter)
  - sessionRepository.createSession(userId, hash)
  - ragConversationRepository.assertOwned(conversationId, userId)
- Lợi ích: service ngắn hơn, dễ unit test, tránh duplicate query ownership.
  Phase 4: Tách Use Case / Application Service
- Tách các service lớn thành use case focused classes.
- Với Todo:
  - CreateTodoUseCase
  - UpdateTodoUseCase
  - MoveTodoStatusUseCase
  - LinkJiraIssueUseCase
  - DeleteTodoUseCase
  - GenerateTodoSummaryUseCase
- Với RAG:
  - RunRagQueryUseCase
  - CreateConversationUseCase
  - SearchKnowledgeUseCase
  - IndexSourceUseCase
- Controller chỉ nhận DTO, lấy currentUser, gọi use case/service, trả response DTO.
- TodoService có thể trở thành facade mỏng hoặc bị thay bằng các use case.
  Phase 5: Refactor AI SDK Layer
- Tạo module riêng: AiModule.
- Các thành phần đề xuất:
  - AiModelProvider: tạo model object từ config.
  - AiTextService: wrapper generateText.
  - AiStreamService: wrapper streamText nếu cần streaming.
  - AiToolRegistry: đăng ký tools theo domain.
  - AiErrorMapper: map provider/tool errors sang exception/log chuẩn.
- Thay dynamic import bằng import bình thường nếu build hỗ trợ ESM, hoặc cô lập dynamic import vào một adapter duy nhất.
- Không để TaskAgentService tự tạo OpenRouter client. Đưa vào provider:
  - OPENROUTER_CLIENT
  - AI_MODEL
  - AI_SDK
- Theo Context7 AI SDK:
  - Dùng generateText cho response thường.
  - Dùng streamText và fullStream nếu muốn expose streaming/chat realtime.
  - Dùng tool({ inputSchema, execute }) cho tools.
  - Dùng Output.object({ schema }) khi cần structured output như summary, task extraction, intent parsing.
  - Dùng stopWhen: stepCountIs(...) hoặc equivalent theo version AI SDK hiện tại.
- Refactor TaskAgentService thành:
  - TaskAgentOrchestrator
  - TaskToolFactory
  - FindTasksTool
  - GetTaskDetailsTool
  - CreateTaskTool
  - UpdateTaskTool
  - UpdateTaskStatusTool
- Tool không query DB trực tiếp. Tool gọi application service/use case để giữ business rules thống nhất với REST API.
  Phase 6: RAG Architecture
- Tách pipeline rõ ràng:
  - EmbeddingService: chỉ embed.
  - ChunkingService: chỉ chunk/enrich content.
  - IndexingService: orchestration indexing.
  - SearchService: vector search.
  - RagPromptBuilder: build prompt/context.
  - RagChatService: phối hợp search + history + AI agent.
- Tạo type cụ thể thay cho any[], Record<string, any> ở RAG metadata:
  - EmbeddingMetadata
  - SearchResultMetadata
  - RagContextChunk
  - ToolCallEvent
- Đưa query vector SQL vào repository để SearchService không phụ thuộc chi tiết TypeORM quá nhiều.
- Thêm transaction cho save user message + assistant message + update conversation title để tránh lưu lệch trạng thái.
  Phase 7: Domain Events Cho Side Effects
- Các side effect hiện tại đang gọi trực tiếp:
  - Todo create/update/delete -> reindex.
  - Todo status move -> Jira sync.
  - Register -> email verification queue.
- Refactor sang event-driven:
  - TodoCreatedEvent
  - TodoUpdatedEvent
  - TodoDeletedEvent
  - TodoStatusChangedEvent
  - UserRegisteredEvent
- Handler:
  - TodoIndexingHandler
  - JiraTodoSyncHandler
  - SendVerificationEmailHandler
- Dùng Nest event emitter hoặc queue tùy độ bền cần thiết.
- Lợi ích: core use case không bị coupling vào RAG/Jira/Mail.
  Phase 8: Error Handling Chuẩn Hóa
- Giữ GlobalExceptionFilter, nhưng giảm any, chuẩn hóa error shape.
- Tạo domain exceptions:
  - OwnedResourceNotFoundException
  - InvalidTodoStatusException
  - AiProviderUnavailableException
  - JiraIntegrationException
- Không throw new Error(...) trong business flow nếu lỗi nên map thành HTTP/domain error.
- AI/tool errors nên log technical details nhưng trả message an toàn.
  Phase 9: Security Và Auth
- Đưa AuthGuard thành global provider bằng APP_GUARD.
- Tránh inject thủ công new AuthGuard(...) trong main.ts.
- Tách AuthService:
  - TokenService
  - SessionService
  - PasswordAuthService
  - EmailVerificationService
- Không dùng Active Record trong auth.
- Kiểm tra TTL blacklist session, refresh token rotation, invalidation behavior.
- Thêm rate limit cho login/register/chat/AI endpoints nếu chưa có.
  Phase 10: API/DTO/Serialization
- Chuẩn hóa response mapping:
  - Không map thủ công lẫn plainToInstance lẫn new Dto(entity) tùy nơi.
  - Chọn một convention: response DTO constructor hoặc plainToInstance.
- DTO request dùng validation đầy đủ:
  - @IsUUID()
  - @IsEnum()
  - @IsOptional()
  - @ValidateNested()
  - @Type()
- Với AI endpoints, giới hạn:
  - max prompt length
  - topK range
  - conversation ownership
  - project ownership
    Phase 11: Testing Strategy
- Unit tests cho use cases với mocked repositories/providers.
- Integration tests cho repository query quan trọng:
  - ownership filter
  - vector search
  - pagination
  - todo status move
- E2E tests cho:
  - auth flow
  - todo CRUD
  - project-scoped todo
  - RAG conversation query
  - AI tool create/update task với mocked AI SDK
- Mock external services:
  - OpenRouter/AI SDK
  - Gemini/Ollama embeddings
  - Jira API
  - Redis/Bull queue nếu cần.
    Phase 12: Cleanup Và Consistency
- Xóa console.\* còn lại.
- Xóa as any không cần thiết.
- Thay new Function('specifier', ...) bằng adapter rõ ràng.
- Đổi any metadata sang type domain.
- Chuẩn hóa naming:
  - \*.req.dto.ts
  - \*.res.dto.ts
  - \*.repository.ts
  - \*.use-case.ts
  - \*.event.ts
  - \*.handler.ts
- Tạo barrel exports cẩn thận, tránh circular dependencies.
  Design Patterns Nên Áp Dụng
- Strategy Pattern: AI providers, embedding providers, Jira auth providers.
- Factory Provider: chọn provider theo config bằng Nest custom provider.
- Repository Pattern: abstract DB access.
- Facade Pattern: RagService, TodoApplicationService nếu cần API đơn giản cho controller.
- Command/Use Case Pattern: mỗi mutation là một class focused.
- Domain Events / Observer: side effects như indexing, Jira sync, email.
- Adapter Pattern: bọc AI SDK/OpenRouter/Ollama/Gemini/Jira.
- Builder Pattern: prompt builder, search context builder.
- Circuit Breaker/Fallback: AI provider fallback hiện có nên formalize thành FallbackAiProvider.
  Thứ Tự Ưu Tiên Khuyến Nghị

1. Refactor infrastructure/global providers/config validation trước.
2. Tách AI SDK adapter và tool registry.
3. Tách repository layer cho Todo/RAG/Auth.
4. Tách use cases và domain events.
5. Chuẩn hóa DTO/error/testing.
6. Cleanup type safety và logging.
   Rủi Ro Cần Kiểm Soát

- AI SDK version hiện tại là ai@^6.0.180; API như stepCountIs/stopWhen cần xác nhận chính xác trong code khi implement vì docs Context7 có thể phản ánh bản mới nhất.
- Refactor TaskAgentService là phần rủi ro cao nhất vì vừa thao tác DB, vừa gọi AI tool, vừa sync Jira/indexing.
- Chuyển Active Record sang repository có thể ảnh hưởng auth/session nếu không test refresh/logout kỹ.
- Event-driven side effects có thể thay đổi timing; cần quyết định side effect nào phải đồng bộ, cái nào fire-and-forget/queue.
  Câu Hỏi Trước Khi Implement

1. Muốn refactor theo hướng an toàn từng phase, hay làm một nhánh lớn thay đổi toàn bộ architecture?
2. AI provider chính vẫn là OpenRouter, hay muốn chuẩn hóa để dễ đổi sang OpenAI/Gemini/Ollama ngang hàng?
3. Side effects như RAG indexing và Jira sync nên chạy đồng bộ để user thấy kết quả ngay, hay chuyển queue/event để API nhanh hơn?
