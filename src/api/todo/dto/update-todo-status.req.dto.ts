import { PartialType } from '@nestjs/mapped-types';
import { CreateTodoStatusReqDto } from './create-todo-status.req.dto';

export class UpdateTodoStatusReqDto extends PartialType(
  CreateTodoStatusReqDto,
) {}
