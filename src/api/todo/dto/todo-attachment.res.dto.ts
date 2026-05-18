import {
  DateField,
  EnumField,
  NumberField,
  StringField,
  UUIDField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { TodoAttachmentKind } from '../enums/todo-attachment-kind.enum';

@Exclude()
export class TodoAttachmentResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  todoId: string;

  @UUIDFieldOptional()
  @Expose()
  commentId?: string;

  @UUIDField()
  @Expose()
  userId: string;

  @EnumField(() => TodoAttachmentKind, { enumName: 'TodoAttachmentKind' })
  @Expose()
  kind: TodoAttachmentKind;

  @StringField()
  @Expose()
  storageKey: string;

  @StringField()
  @Expose()
  url: string;

  @StringField()
  @Expose()
  originalName: string;

  @StringField()
  @Expose()
  mimeType: string;

  @NumberField({ int: true })
  @Expose()
  size: number;

  @DateField()
  @Expose()
  createdAt: Date;

  @DateField()
  @Expose()
  updatedAt: Date;
}
