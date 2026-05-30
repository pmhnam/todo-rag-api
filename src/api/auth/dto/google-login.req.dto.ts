import { StringField } from '@/decorators/field.decorators';

export class GoogleLoginReqDto {
  @StringField()
  idToken!: string;
}
