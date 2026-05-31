import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ResolveSourcesReqDto {
  @ApiProperty({
    type: [String],
    description: 'Embedding source IDs to resolve',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  sourceIds: string[];
}
