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
import { ListTodoReqDto } from '../dto/list-todo.req.dto';
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
