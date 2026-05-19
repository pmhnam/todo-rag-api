import { NumberField, StringField } from '@/decorators/field.decorators';

export class CompleteAvatarReqDto {
  @StringField()
  key!: string;

  @StringField()
  url!: string;

  @StringField()
  filename!: string;

  @StringField()
  mimeType!: string;

  @NumberField({ int: true, min: 1 })
  size!: number;
}
