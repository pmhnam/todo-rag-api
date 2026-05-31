import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateRagSettingsReqDto {
  @ApiPropertyOptional({
    description: 'Default number of context chunks for this project',
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    description: 'Max cosine distance for retrieval filtering',
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Enable query reformulation' })
  @IsOptional()
  @IsBoolean()
  enableQueryRewrite?: boolean;

  @ApiPropertyOptional({
    description: 'Filter retrieval to project-scoped sources',
  })
  @IsOptional()
  @IsBoolean()
  filterByProject?: boolean;
}
