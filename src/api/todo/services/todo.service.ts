import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { CreateTodoReqDto } from '../dto/create-todo.req.dto';
import { LinkJiraIssueReqDto } from '../dto/link-jira-issue.req.dto';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { ReorderTodosReqDto } from '../dto/reorder-todos.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { CreateTodoUseCase } from '../use-cases/create-todo.use-case';
import { DeleteTodoUseCase } from '../use-cases/delete-todo.use-case';
import { FindTodosUseCase } from '../use-cases/find-todos.use-case';
import { GetTodoDetailUseCase } from '../use-cases/get-todo-detail.use-case';
import { LinkJiraIssueUseCase } from '../use-cases/link-jira-issue.use-case';
import { ReorderTodosUseCase } from '../use-cases/reorder-todos.use-case';
import { UpdateTodoUseCase } from '../use-cases/update-todo.use-case';

@Injectable()
export class TodoService {
  constructor(
    private readonly findTodosUseCase: FindTodosUseCase,
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly createTodoUseCase: CreateTodoUseCase,
    private readonly updateTodoUseCase: UpdateTodoUseCase,
    private readonly linkJiraIssueUseCase: LinkJiraIssueUseCase,
    private readonly deleteTodoUseCase: DeleteTodoUseCase,
    private readonly reorderTodosUseCase: ReorderTodosUseCase,
  ) {}

  findMany(
    userId: Uuid,
    reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    return this.findTodosUseCase.execute(userId, reqDto);
  }

  findOne(id: Uuid, userId: Uuid): Promise<TodoResDto> {
    return this.getTodoDetailUseCase.execute(id, userId);
  }

  create(userId: Uuid, reqDto: CreateTodoReqDto): Promise<TodoResDto> {
    return this.createTodoUseCase.execute(userId, reqDto);
  }

  update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    return this.updateTodoUseCase.execute(id, userId, reqDto);
  }

  linkJiraIssue(
    id: Uuid,
    userId: Uuid,
    reqDto: LinkJiraIssueReqDto,
  ): Promise<TodoResDto> {
    return this.linkJiraIssueUseCase.execute(id, userId, reqDto);
  }

  delete(id: Uuid, userId: Uuid): Promise<void> {
    return this.deleteTodoUseCase.execute(id, userId);
  }

  reorder(userId: Uuid, reqDto: ReorderTodosReqDto): Promise<void> {
    return this.reorderTodosUseCase.execute(userId, reqDto);
  }
}
