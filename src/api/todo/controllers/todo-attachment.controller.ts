import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CompleteTodoAttachmentReqDto } from '../dto/complete-todo-attachment.req.dto';
import { PresignTodoAttachmentReqDto } from '../dto/presign-todo-attachment.req.dto';
import { PresignTodoAttachmentResDto } from '../dto/presign-todo-attachment.res.dto';
import { TodoAttachmentResDto } from '../dto/todo-attachment.res.dto';
import { CompleteTodoAttachmentUseCase } from '../use-cases/complete-todo-attachment.use-case';
import { DeleteTodoAttachmentUseCase } from '../use-cases/delete-todo-attachment.use-case';
import { PresignTodoAttachmentUseCase } from '../use-cases/presign-todo-attachment.use-case';

@ApiTags('todo-attachments')
@Controller({
  path: 'todos/:todoId/attachments',
  version: '1',
})
export class TodoAttachmentController {
  constructor(
    private readonly presignTodoAttachmentUseCase: PresignTodoAttachmentUseCase,
    private readonly completeTodoAttachmentUseCase: CompleteTodoAttachmentUseCase,
    private readonly deleteTodoAttachmentUseCase: DeleteTodoAttachmentUseCase,
  ) {}

  @Post('presign')
  @ApiAuth({
    type: PresignTodoAttachmentResDto,
    summary: 'Presign attachment upload',
  })
  @ApiParam({ name: 'todoId', type: 'String' })
  presign(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Body() reqDto: PresignTodoAttachmentReqDto,
  ): Promise<PresignTodoAttachmentResDto> {
    return this.presignTodoAttachmentUseCase.execute(todoId, userId, reqDto);
  }

  @Post('complete')
  @ApiAuth({
    type: TodoAttachmentResDto,
    summary: 'Complete attachment upload',
  })
  @ApiParam({ name: 'todoId', type: 'String' })
  complete(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Body() reqDto: CompleteTodoAttachmentReqDto,
  ): Promise<TodoAttachmentResDto> {
    return this.completeTodoAttachmentUseCase.execute(todoId, userId, reqDto);
  }

  @Delete(':attachmentId')
  @ApiAuth({ summary: 'Delete a todo attachment' })
  @ApiParam({ name: 'todoId', type: 'String' })
  @ApiParam({ name: 'attachmentId', type: 'String' })
  delete(
    @CurrentUser('id') userId: Uuid,
    @Param('todoId', ParseUUIDPipe) todoId: Uuid,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: Uuid,
  ): Promise<void> {
    return this.deleteTodoAttachmentUseCase.execute(
      todoId,
      attachmentId,
      userId,
    );
  }
}
