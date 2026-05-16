import { StringField } from '@/decorators/field.decorators';

export class CreateTodoCommentReqDto {
  @StringField({ maxLength: 2000 })
  readonly content: string;
}
