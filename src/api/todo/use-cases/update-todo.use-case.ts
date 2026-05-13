import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoAiSummaryService } from '../services/todo-ai-summary.service';
import { TodoIndexingService } from '../services/todo-indexing.service';
import { TodoJiraSyncService } from '../services/todo-jira-sync.service';

@Injectable()
export class UpdateTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly todoAiSummaryService: TodoAiSummaryService,
    private readonly todoIndexingService: TodoIndexingService,
    private readonly todoJiraSyncService: TodoJiraSyncService,
  ) {}

  async execute(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    const todo = await this.todoRepository.findOwnedWithStatus(id, userId);

    if (!todo) {
      throw new NotFoundException({ errorCode: ErrorCode.E110 });
    }

    const statusChanged = Boolean(
      reqDto.statusId && reqDto.statusId !== todo.statusId,
    );

    if (statusChanged) {
      const status = await this.todoStatusRepository.findOwnedInProject(
        reqDto.statusId as Uuid,
        userId,
        todo.projectId,
      );

      if (!status) {
        throw new ValidationException(ErrorCode.E111);
      }

      todo.status = status;
    }

    let data = reqDto;
    if (!todo.aiSummary && !data.aiSummary) {
      const aiSummary = await this.todoAiSummaryService.generate(
        data.title ?? todo.title,
        data.description ?? todo.description,
      );

      if (aiSummary) {
        data = { ...data, aiSummary, generatedByAi: true };
      }
    }

    Object.assign(todo, data);
    todo.updatedBy = userId;

    const saved = await this.todoRepository.save(todo);

    if (statusChanged) {
      await this.todoJiraSyncService.syncStatusAfterLocalMove(userId, saved);
    }

    this.todoIndexingService.reindexAsync(userId, saved);

    return plainToInstance(TodoResDto, saved);
  }
}
