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
import { CreateTodoStatusReqDto } from '../dto/create-todo-status.req.dto';
import { ListTodoStatusReqDto } from '../dto/list-todo-status.req.dto';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { UpdateTodoStatusReqDto } from '../dto/update-todo-status.req.dto';
import { TodoStatusService } from '../services/todo-status.service';

@ApiTags('todo-statuses')
@Controller({
  path: 'todo-statuses',
  version: '1',
})
export class TodoStatusController {
  constructor(private readonly todoStatusService: TodoStatusService) {}

  @Get()
  @ApiAuth({
    type: TodoStatusResDto,
    summary: 'Get all todo status columns',
    isPaginated: true,
  })
  async findAll(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: ListTodoStatusReqDto,
  ): Promise<OffsetPaginatedDto<TodoStatusResDto>> {
    return this.todoStatusService.findAll(userId, reqDto);
  }

  @Get(':id')
  @ApiAuth({
    type: TodoStatusResDto,
    summary: 'Get todo status by ID',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async findOne(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<TodoStatusResDto> {
    return this.todoStatusService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: TodoStatusResDto,
    summary: 'Create a new todo status column',
    statusCode: HttpStatus.CREATED,
  })
  async create(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: CreateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    return this.todoStatusService.create(userId, reqDto);
  }

  @Patch(':id')
  @ApiAuth({
    type: TodoStatusResDto,
    summary: 'Update a todo status column',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async update(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    return this.todoStatusService.update(id, userId, reqDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete a todo status column (blocked if it has todos)',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async delete(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<void> {
    return this.todoStatusService.delete(id, userId);
  }
}
