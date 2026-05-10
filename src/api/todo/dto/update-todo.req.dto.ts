import { PartialType } from '@nestjs/mapped-types';
import { CreateTodoReqDto } from './create-todo.req.dto';

export class UpdateTodoReqDto extends PartialType(CreateTodoReqDto) {}
