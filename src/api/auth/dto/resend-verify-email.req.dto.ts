import { EmailField } from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';

export class ResendVerifyEmailReqDto {
  @EmailField()
  @Transform(lowerCaseTransformer)
  email!: string;
}
