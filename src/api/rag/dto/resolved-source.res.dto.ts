import { ApiProperty } from '@nestjs/swagger';
import { SourceType } from '../enums/source-type.enum';

export class ResolvedSourceResDto {
  @ApiProperty({ description: 'Embedding source ID' })
  embeddingSourceId: string;

  @ApiProperty({ type: String, enum: SourceType, enumName: 'SourceType' })
  sourceType: SourceType;

  @ApiProperty({ description: 'Original record ID for the source' })
  sourceId: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  projectId?: string;

  @ApiProperty({ required: false })
  slug?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}
