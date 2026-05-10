import { ApiProperty } from '@nestjs/swagger';

export class SearchResultResDto {
  @ApiProperty()
  chunkId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  sourceId: string;

  @ApiProperty({
    description: 'Cosine distance (lower = more similar)',
  })
  distance: number;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}
