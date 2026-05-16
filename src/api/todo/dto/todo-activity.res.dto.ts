import {
  DateField,
  EnumField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { TodoActivityType } from '../enums/todo-activity-type.enum';

@Exclude()
export class TodoActivityResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  todoId: string;

  @UUIDField()
  @Expose()
  userId: string;

  @EnumField(() => TodoActivityType, { enumName: 'TodoActivityType' })
  @Expose()
  type: TodoActivityType;

  @StringField()
  @Expose()
  message: string;

  @ApiProperty({ required: false })
  @Expose()
  metadata?: Record<string, any>;

  @DateField()
  @Expose()
  createdAt: Date;
}
