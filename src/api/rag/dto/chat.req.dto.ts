import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ChatReqDto {
  @ApiProperty({
    description: 'User message',
    example: 'What are my high priority tasks?',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Number of context chunks to retrieve',
    required: false,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;
}
