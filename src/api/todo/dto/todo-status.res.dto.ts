import {
  DateField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TodoStatusResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  projectId: string;

  @StringField()
  @Expose()
  name: string;

  @NumberField({ int: true })
  @Expose()
  order: number;

  @StringFieldOptional()
  @Expose()
  color?: string;

  @DateField()
  @Expose()
  createdAt: Date;

  @DateField()
  @Expose()
  updatedAt: Date;
}
