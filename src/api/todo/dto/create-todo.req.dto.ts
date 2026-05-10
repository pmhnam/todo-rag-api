import {
  DateFieldOptional,
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { TodoPriority } from '../enums/todo-priority.enum';

export class CreateTodoReqDto {
  @StringField({ maxLength: 255 })
  readonly title: string;

  @StringFieldOptional()
  readonly description?: string;

  @UUIDField({ description: 'ID of the todo status column' })
  readonly statusId: string;

  @EnumFieldOptional(() => TodoPriority, {
    default: TodoPriority.MEDIUM,
    enumName: 'TodoPriority',
  })
  readonly priority?: TodoPriority = TodoPriority.MEDIUM;

  @DateFieldOptional({ description: 'Due date (YYYY-MM-DD)' })
  readonly dueDate?: Date;
}
