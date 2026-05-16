import {
  BooleanFieldOptional,
  ClassFieldOptional,
  DateFieldOptional,
  EnumFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  URLField,
  UUIDField,
} from '@/decorators/field.decorators';
import { TodoPriority } from '../enums/todo-priority.enum';

export class ExternalLinkDto {
  @StringField({ maxLength: 100 })
  name: string;

  @URLField()
  url: string;
}

export class CreateTodoReqDto {
  @UUIDField({ description: 'ID of the project' })
  readonly projectId: string;

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

  @NumberFieldOptional({ int: true, min: 0 })
  readonly position?: number;

  @DateFieldOptional({ description: 'Due date (YYYY-MM-DD)' })
  readonly dueDate?: Date;

  @StringFieldOptional({ each: true })
  readonly tags?: string[];

  @ClassFieldOptional(() => ExternalLinkDto, { each: true })
  readonly externalLinks?: ExternalLinkDto[];

  @StringFieldOptional()
  readonly aiSummary?: string;

  @BooleanFieldOptional()
  readonly generatedByAi?: boolean;
}
