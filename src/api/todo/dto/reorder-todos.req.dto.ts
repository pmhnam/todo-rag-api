import { ClassField, UUIDField } from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

export class ReorderTodoColumnDto {
  @UUIDField({ description: 'Todo status column ID' })
  readonly statusId: string;

  @UUIDField({ each: true, description: 'Ordered todo IDs in this column' })
  @IsArray()
  @ArrayMinSize(0)
  readonly orderedTodoIds: string[];
}

export class ReorderTodosReqDto {
  @UUIDField({ description: 'Project ID' })
  readonly projectId: string;

  @ClassField(() => ReorderTodoColumnDto, { each: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderTodoColumnDto)
  readonly columns: ReorderTodoColumnDto[];
}
