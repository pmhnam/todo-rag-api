import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EmbeddingSourceResDto } from '../dto/embedding-source.res.dto';
import { IndexSourceReqDto } from '../dto/index-source.req.dto';
import { SourceType } from '../enums/source-type.enum';
import { IndexingHelperService } from '../services/indexing-helper.service';
import { IndexingService } from '../services/indexing.service';

@ApiTags('rag/indexing')
@Controller({
  path: 'rag/index',
  version: '1',
})
export class IndexingController {
  constructor(
    private readonly indexingService: IndexingService,
    private readonly indexingHelperService: IndexingHelperService,
  ) {}

  @Post()
  @ApiAuth({
    type: EmbeddingSourceResDto,
    summary: 'Index a DB record for RAG',
  })
  async indexRecord(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: IndexSourceReqDto,
  ): Promise<EmbeddingSourceResDto> {
    const { content, metadata } =
      await this.indexingHelperService.getRecordContent(
        reqDto.sourceType,
        reqDto.sourceId as Uuid,
        userId,
      );

    const source = await this.indexingService.indexRecord(
      userId,
      reqDto.sourceType,
      reqDto.sourceId as Uuid,
      content,
      { ...metadata, ...reqDto.metadata },
    );

    return this.toResDto(source);
  }

  @Get('sources')
  @ApiAuth({
    type: EmbeddingSourceResDto,
    summary: 'List indexed sources for current user',
  })
  @ApiQuery({
    name: 'sourceType',
    type: String,
    enum: SourceType,
    enumName: 'SourceType',
    required: false,
  })
  async listSources(
    @CurrentUser('id') userId: Uuid,
    @Query('sourceType') sourceType?: SourceType,
  ): Promise<EmbeddingSourceResDto[]> {
    const sources = await this.indexingService.findUserSources(
      userId,
      sourceType,
    );
    return sources.map((s) => this.toResDto(s));
  }

  @Delete(':sourceId')
  @ApiAuth({
    summary: 'Remove an indexed source',
  })
  @ApiParam({ name: 'sourceId', type: 'String' })
  async removeSource(
    @CurrentUser('id') userId: Uuid,
    @Param('sourceId', ParseUUIDPipe) sourceId: Uuid,
  ): Promise<void> {
    const source = await this.indexingService.findSource(sourceId);

    // Verify ownership
    if (source.userId !== userId) {
      throw new Error('Forbidden');
    }

    await this.indexingService.removeIndex(source.sourceType, source.sourceId);
  }

  private toResDto(source: any): EmbeddingSourceResDto {
    return {
      id: source.id,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      status: source.status,
      metadata: source.metadata,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }
}
