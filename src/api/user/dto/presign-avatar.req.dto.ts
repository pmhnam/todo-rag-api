import { NumberField, StringField } from '@/decorators/field.decorators';

export class PresignAvatarReqDto {
  @StringField()
  filename!: string;

  @StringField()
  mimeType!: string;

  @NumberField({ int: true, min: 1 })
  size!: number;
}
