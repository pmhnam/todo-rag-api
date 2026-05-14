import { ApiProperty } from '@nestjs/swagger';
import { EmbeddingStatus } from '../enums/embedding-status.enum';
import { SourceType } from '../enums/source-type.enum';

export class EmbeddingSourceResDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, enum: SourceType, enumName: 'SourceType' })
  sourceType: SourceType;

  @ApiProperty()
  sourceId: string;

  @ApiProperty({
    type: String,
    enum: EmbeddingStatus,
    enumName: 'EmbeddingStatus',
  })
  status: EmbeddingStatus;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
