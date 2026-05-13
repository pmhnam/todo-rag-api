import { ApiProperty } from '@nestjs/swagger';

export class ContextChunkDto {
  @ApiProperty()
  chunkId: string;

  @ApiProperty()
  sourceId: string;

  @ApiProperty()
  distance: number;

  @ApiProperty()
  contentPreview: string;
}

export class ChatResDto {
  @ApiProperty({
    description: 'AI assistant response',
  })
  response: string;

  @ApiProperty({
    description: 'Context chunks used for generating the response',
    type: [ContextChunkDto],
  })
  contextChunks: ContextChunkDto[];

  @ApiProperty({
    description: 'Task agent tool calls executed while producing the response',
    required: false,
    isArray: true,
  })
  toolCalls?: Array<{
    toolName: string;
    input: unknown;
    output?: unknown;
  }>;
}
