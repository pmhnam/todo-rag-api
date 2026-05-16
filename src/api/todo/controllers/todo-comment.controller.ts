import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateTodoCommentReqDto } from '../dto/create-todo-comment.req.dto';
import { TodoCommentResDto } from '../dto/todo-comment.res.dto';
import { UpdateTodoCommentReqDto } from '../dto/update-todo-comment.req.dto';
import { CreateTodoCommentUseCase } from '../use-cases/create-todo-comment.use-case';
import { DeleteTodoCommentUseCase } from '../use-cases/delete-todo-comment.use-case';
import { FindTodoCommentsUseCase } from '../use-cases/find-todo-comments.use-case';
import { UpdateTodoCommentUseCase } from '../use-cases/update-todo-comment.use-case';

@ApiTags('todo-comments')
@Controller({
  path: 'todos/:todoId/comments',
  version: '1',
})
export class TodoCommentController {
  constructor(
    private readonly findTodoCommentsUseCase: FindTodoCommentsUseCase,
    private readonly createTodoCommentUseCase: CreateTodoCommentUseCase,
    private readonly updateTodoCommentUseCase: UpdateTodoCommentUseCase,
    private readonly deleteTodoCommentUseCase: DeleteTodoCommentUseCase,
  ) {}

  @Get()
  @ApiAuth({ type: TodoCommentResDto, summary: 'List task comments' })
  @ApiParam({ name: 'todoId', type: 'String' })
  findMany(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
  ): Promise<TodoCommentResDto[]> {
    return this.findTodoCommentsUseCase.execute(todoId, userId);
  }

  @Post()
  @ApiAuth({ type: TodoCommentResDto, summary: 'Create a task comment' })
  @ApiParam({ name: 'todoId', type: 'String' })
  create(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Body() reqDto: CreateTodoCommentReqDto,
  ): Promise<TodoCommentResDto> {
    return this.createTodoCommentUseCase.execute(todoId, userId, reqDto);
  }

  @Patch(':commentId')
  @ApiAuth({ type: TodoCommentResDto, summary: 'Update a task comment' })
  @ApiParam({ name: 'todoId', type: 'String' })
  @ApiParam({ name: 'commentId', type: 'String' })
  update(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Param('commentId', ParseUUIDPipe) commentId: Uuid,
    @Body() reqDto: UpdateTodoCommentReqDto,
  ): Promise<TodoCommentResDto> {
    return this.updateTodoCommentUseCase.execute(
      todoId,
      commentId,
      userId,
      reqDto,
    );
  }

  @Delete(':commentId')
  @ApiAuth({ summary: 'Delete a task comment' })
  @ApiParam({ name: 'todoId', type: 'String' })
  @ApiParam({ name: 'commentId', type: 'String' })
  delete(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Param('commentId', ParseUUIDPipe) commentId: Uuid,
  ): Promise<void> {
    return this.deleteTodoCommentUseCase.execute(todoId, commentId, userId);
  }
}
