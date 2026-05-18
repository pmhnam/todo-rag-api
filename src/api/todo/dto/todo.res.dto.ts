import { WrapperType } from '@/common/types/types';
import {
  BooleanFieldOptional,
  ClassFieldOptional,
  DateField,
  DateFieldOptional,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoPriority } from '../enums/todo-priority.enum';
import { ExternalLinkDto } from './create-todo.req.dto';
import { TodoAttachmentResDto } from './todo-attachment.res.dto';
import { TodoStatusResDto } from './todo-status.res.dto';

@Exclude()
export class TodoResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  projectId: string;

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

  @NumberField({ int: true })
  @Expose()
  position: number;

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

  @StringFieldOptional({ each: true })
  @Expose()
  tags?: string[];

  @ClassFieldOptional(() => ExternalLinkDto, { each: true })
  @Expose()
  externalLinks?: ExternalLinkDto[];

  @StringFieldOptional()
  @Expose()
  aiSummary?: string;

  @BooleanFieldOptional()
  @Expose()
  generatedByAi?: boolean;

  @DateFieldOptional()
  @Expose()
  archivedAt?: Date;

  @StringFieldOptional()
  @Expose()
  archivedBy?: string;

  @ClassFieldOptional(() => TodoAttachmentResDto, { each: true })
  @Expose()
  attachments?: WrapperType<TodoAttachmentResDto[]>;
}
