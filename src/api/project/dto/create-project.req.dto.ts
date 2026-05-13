import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectReqDto {
  @ApiProperty({ example: 'My Awesome Project' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'This is a description' })
  @IsString()
  @IsOptional()
  description?: string;
}
