import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class IndexCustomSourceReqDto {
  @ApiProperty({
    description: 'Plain text content to index',
    example: 'Project onboarding notes and requirements...',
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    description: 'Optional metadata to store with the embedding',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
