import { WrapperType } from '@/common/types/types';
import {
  ClassFieldOptional,
  DateField,
  DateFieldOptional,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoPriority } from '../enums/todo-priority.enum';
import { TodoStatusResDto } from './todo-status.res.dto';

@Exclude()
export class TodoResDto {
  @UUIDField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  title: string;

  @StringFieldOptional()
  @Expose()
  description?: string;

  @UUIDField()
  @Expose()
  statusId: string;

  @ClassFieldOptional(() => TodoStatusResDto)
  @Expose()
  status?: WrapperType<TodoStatusResDto>;

  @EnumField(() => TodoPriority, { enumName: 'TodoPriority' })
  @Expose()
  priority: TodoPriority;

  @DateFieldOptional()
  @Expose()
  dueDate?: Date;

  // Jira fields
  @StringFieldOptional()
  @Expose()
  jiraIssueKey?: string;

  @StringFieldOptional()
  @Expose()
  jiraIssueUrl?: string;

  @EnumField(() => JiraSyncStatus, { enumName: 'JiraSyncStatus' })
  @Expose()
  jiraSyncStatus: JiraSyncStatus;

  @DateFieldOptional()
  @Expose()
  jiraLastSyncedAt?: Date;

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
