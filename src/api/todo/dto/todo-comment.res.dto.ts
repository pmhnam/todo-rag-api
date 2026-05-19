import {
  ClassField,
  ClassFieldOptional,
  DateField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { UserResDto } from '../../user/dto/user.res.dto';
import { TodoAttachmentResDto } from './todo-attachment.res.dto';

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

  @ClassField(() => UserResDto)
  @Expose()
  user?: UserResDto;

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

  @ClassFieldOptional(() => TodoAttachmentResDto, { each: true })
  @Expose()
  attachments?: TodoAttachmentResDto[];
}
