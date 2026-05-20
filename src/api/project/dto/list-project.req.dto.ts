import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { UUIDFieldOptional } from '@/decorators/field.decorators';

export class ListProjectReqDto extends PageOptionsDto {
  @UUIDFieldOptional()
  workspaceId?: string;
}
