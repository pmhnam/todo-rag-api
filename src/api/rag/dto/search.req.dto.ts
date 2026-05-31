import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SearchReqDto {
  @ApiProperty({
    description: 'Search query text',
    example: 'fix login bug',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Number of top results to return',
    required: false,
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiProperty({
    description: 'Project ID to apply project RAG settings',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
