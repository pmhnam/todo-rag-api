import { StringFieldOptional } from '@/decorators/field.decorators';

export class UpdateTodoCommentReqDto {
  @StringFieldOptional({ maxLength: 2000 })
  readonly content?: string;
}
