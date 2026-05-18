import { StringField } from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class PresignTodoAttachmentResDto {
  @StringField()
  @Expose()
  key: string;

  @StringField()
  @Expose()
  uploadUrl: string;

  @StringField()
  @Expose()
  publicUrl: string;

  @Expose()
  headers: Record<string, string>;
}
