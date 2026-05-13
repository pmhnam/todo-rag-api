import {
  BooleanField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class JiraTestConnectionResDto {
  @BooleanField()
  @Expose()
  success: boolean;

  @StringFieldOptional()
  @Expose()
  accountId?: string;

  @StringFieldOptional()
  @Expose()
  displayName?: string;
}
