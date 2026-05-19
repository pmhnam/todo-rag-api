import { StringField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';

export class PresignAvatarResDto {
  @StringField()
  key!: string;

  @StringField()
  uploadUrl!: string;

  @StringField()
  publicUrl!: string;

  @ApiProperty({ type: Object })
  headers!: Record<string, string>;
}
