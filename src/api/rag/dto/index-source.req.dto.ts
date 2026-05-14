import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { SourceType } from '../enums/source-type.enum';

export class IndexSourceReqDto {
  @ApiProperty({
    type: String,
    enum: SourceType,
    enumName: 'SourceType',
    description: 'Type of the source record',
    example: SourceType.TODO,
  })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty({
    description: 'ID of the source record to index',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  sourceId: string;

  @ApiProperty({
    description: 'Optional extra metadata to store with the embedding',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
