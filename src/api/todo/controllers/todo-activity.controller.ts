import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { TodoActivityResDto } from '../dto/todo-activity.res.dto';
import { FindTodoActivitiesUseCase } from '../use-cases/find-todo-activities.use-case';

@ApiTags('todo-activities')
@Controller({ path: 'todos/:todoId/activities', version: '1' })
export class TodoActivityController {
  constructor(
    private readonly findTodoActivitiesUseCase: FindTodoActivitiesUseCase,
  ) {}

  @Get()
  @ApiAuth({ type: TodoActivityResDto, summary: 'List task activities' })
  @ApiParam({ name: 'todoId', type: 'String' })
  findMany(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
  ) {
    return this.findTodoActivitiesUseCase.execute(todoId, userId);
  }
}
