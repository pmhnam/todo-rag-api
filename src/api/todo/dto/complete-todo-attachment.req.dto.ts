import {
  NumberField,
  StringField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';

export class CompleteTodoAttachmentReqDto {
  @StringField({ maxLength: 700 })
  readonly key: string;

  @StringField({ maxLength: 1000 })
  readonly url: string;

  @StringField({ maxLength: 255 })
  readonly filename: string;

  @StringField({ maxLength: 100 })
  readonly mimeType: string;

  @NumberField({ int: true, min: 1 })
  readonly size: number;

  @UUIDFieldOptional()
  readonly commentId?: string;
}
