import { ApiProperty } from '@nestjs/swagger';

export class ConversationResDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
