import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateTodoReqDto } from '../dto/create-todo.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { TodoPriority } from '../enums/todo-priority.enum';
import { TodoStatusRepository } from '../repositories/todo-status.repository';
import { TodoRepository } from '../repositories/todo.repository';
import { TodoAiSummaryService } from '../services/todo-ai-summary.service';
import { TodoIndexingService } from '../services/todo-indexing.service';

@Injectable()
export class CreateTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly todoAiSummaryService: TodoAiSummaryService,
    private readonly todoIndexingService: TodoIndexingService,
  ) {}

  async execute(userId: Uuid, reqDto: CreateTodoReqDto): Promise<TodoResDto> {
    const status = await this.todoStatusRepository.findOwnedInProject(
      reqDto.statusId as Uuid,
      userId,
      reqDto.projectId as Uuid,
    );

    if (!status) {
      throw new ValidationException(ErrorCode.E111);
    }

    let data = reqDto;
    if (!data.aiSummary) {
      const aiSummary = await this.todoAiSummaryService.generate(
        data.title,
        data.description,
      );

      if (aiSummary) {
        data = { ...data, aiSummary, generatedByAi: true };
      }
    }

    const todo = this.todoRepository.create({
      ...data,
      statusId: data.statusId as Uuid,
      projectId: data.projectId as Uuid,
      priority: data.priority || TodoPriority.MEDIUM,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.todoRepository.save(todo);
    saved.status = status;
    this.todoIndexingService.reindexAsync(userId, saved);

    return plainToInstance(TodoResDto, saved);
  }
}
