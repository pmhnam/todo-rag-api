import { NumberField, StringField } from '@/decorators/field.decorators';

export class PresignTodoAttachmentReqDto {
  @StringField({ maxLength: 255 })
  readonly filename: string;

  @StringField({ maxLength: 100 })
  readonly mimeType: string;

  @NumberField({ int: true, min: 1 })
  readonly size: number;
}
