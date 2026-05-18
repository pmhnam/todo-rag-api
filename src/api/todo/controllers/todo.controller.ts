import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateTodoReqDto } from '../dto/create-todo.req.dto';
import { LinkJiraIssueReqDto } from '../dto/link-jira-issue.req.dto';
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
import { ReorderTodosReqDto } from '../dto/reorder-todos.req.dto';
import { TodoResDto } from '../dto/todo.res.dto';
import { UpdateTodoReqDto } from '../dto/update-todo.req.dto';
import { TodoService } from '../services/todo.service';

@ApiTags('todos')
@Controller({
  path: 'todos',
  version: '1',
})
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @ApiAuth({
    type: TodoResDto,
    summary:
      'Get todos (paginated, filterable by statusId/priority/jiraSyncStatus)',
    isPaginated: true,
  })
  async findMany(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: ListTodoReqDto,
  ): Promise<OffsetPaginatedDto<TodoResDto>> {
    return this.todoService.findMany(userId, reqDto);
  }

  @Get('board')
  @ApiAuth({
    type: TodoResDto,
    summary:
      'Get board todos in one request, filterable by project/priority/jiraSyncStatus/search',
  })
  async findBoard(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: ListTodoReqDto,
  ): Promise<TodoResDto[]> {
    return this.todoService.findBoard(userId, reqDto);
  }

  @Get(':id')
  @ApiAuth({
    type: TodoResDto,
    summary: 'Get todo by ID',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async findOne(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<TodoResDto> {
    return this.todoService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: TodoResDto,
    summary: 'Create a new todo',
    statusCode: HttpStatus.CREATED,
  })
  async create(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: CreateTodoReqDto,
  ): Promise<TodoResDto> {
    return this.todoService.create(userId, reqDto);
  }

  @Patch('reorder')
  @ApiAuth({
    summary: 'Persist todo ordering for one or more columns',
  })
  async reorder(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: ReorderTodosReqDto,
  ): Promise<void> {
    return this.todoService.reorder(userId, reqDto);
  }

  @Patch(':id')
  @ApiAuth({
    type: TodoResDto,
    summary: 'Update a todo',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async update(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateTodoReqDto,
  ): Promise<TodoResDto> {
    return this.todoService.update(id, userId, reqDto);
  }

  @Patch(':id/jira-link')
  @ApiAuth({
    type: TodoResDto,
    summary: 'Link a todo to a Jira issue key',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async linkJiraIssue(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: LinkJiraIssueReqDto,
  ): Promise<TodoResDto> {
    return this.todoService.linkJiraIssue(id, userId, reqDto);
  }

  @Patch(':id/archive')
  @ApiAuth({
    type: TodoResDto,
    summary: 'Archive a todo',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async archive(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<TodoResDto> {
    return this.todoService.archive(id, userId);
  }

  @Patch(':id/unarchive')
  @ApiAuth({
    type: TodoResDto,
    summary: 'Restore an archived todo',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async unarchive(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<TodoResDto> {
    return this.todoService.unarchive(id, userId);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Soft delete a todo',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async delete(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<void> {
    return this.todoService.delete(id, userId);
  }
}
