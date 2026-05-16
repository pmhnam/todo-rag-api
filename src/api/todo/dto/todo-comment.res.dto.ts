import {
  DateField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TodoCommentResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  todoId: string;

  @UUIDField()
  @Expose()
  userId: string;

  @StringField()
  @Expose()
  content: string;

  @StringField()
  @Expose()
  createdBy: string;

  @DateField()
  @Expose()
  createdAt: Date;

  @DateField()
  @Expose()
  updatedAt: Date;
}
