import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import {
  EnumFieldOptional,
  UUIDField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoPriority } from '../enums/todo-priority.enum';

export class ListTodoReqDto extends PageOptionsDto {
  @UUIDField({ description: 'Filter by project ID' })
  readonly projectId: string;

  @UUIDFieldOptional({ description: 'Filter by status column ID' })
  readonly statusId?: string;

  @EnumFieldOptional(() => TodoPriority, { enumName: 'TodoPriority' })
  readonly priority?: TodoPriority;

  @EnumFieldOptional(() => JiraSyncStatus, { enumName: 'JiraSyncStatus' })
  readonly jiraSyncStatus?: JiraSyncStatus;
}
