import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { UUIDField } from '@/decorators/field.decorators';

export class ListTodoStatusReqDto extends PageOptionsDto {
  @UUIDField({ description: 'Filter by project ID' })
  readonly projectId: string;
}
