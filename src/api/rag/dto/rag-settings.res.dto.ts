import { ApiProperty } from '@nestjs/swagger';

export class RagSettingsResDto {
  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ minimum: 1, maximum: 20 })
  topK: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 2 })
  maxDistance?: number;

  @ApiProperty()
  enableQueryRewrite: boolean;

  @ApiProperty()
  filterByProject: boolean;
}
