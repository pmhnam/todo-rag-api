import {
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';

export class CreateTodoStatusReqDto {
  @UUIDField({ description: 'ID of the project' })
  readonly projectId: string;

  @StringField({ maxLength: 100 })
  readonly name: string;

  @NumberFieldOptional({ int: true, min: 0, default: 0 })
  readonly order?: number = 0;

  @StringFieldOptional({
    maxLength: 20,
    description: 'Color hex code, e.g. #FF5733',
  })
  readonly color?: string;
}
