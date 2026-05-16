import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ToolConfirmationDto {
  @ApiProperty({ description: 'Approved tool name' })
  @IsString()
  approvedToolName: string;

  @ApiProperty({ description: 'Approved tool input' })
  @IsObject()
  approvedInput: Record<string, unknown>;
}

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

  @ApiProperty({
    description: 'Current project/board ID for task agent actions',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'Tool confirmation payload for destructive AI actions',
    required: false,
    type: ToolConfirmationDto,
  })
  @IsOptional()
  @IsObject()
  confirmation?: ToolConfirmationDto;
}
