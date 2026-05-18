import { StringFieldOptional } from '@/decorators/field.decorators';

export class CreateTodoCommentReqDto {
  @StringFieldOptional({ maxLength: 2000 })
  readonly content?: string;

  @StringFieldOptional({ each: true, maxLength: 700 })
  readonly attachmentKeys?: string[];
}
