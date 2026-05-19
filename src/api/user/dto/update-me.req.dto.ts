import {
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class UpdateMeReqDto {
  @StringField()
  name!: string;

  @StringFieldOptional()
  bio?: string;
}
