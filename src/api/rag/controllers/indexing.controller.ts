import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingSourceResDto } from '../dto/embedding-source.res.dto';
import { IndexCustomSourceReqDto } from '../dto/index-custom-source.req.dto';
import { IndexSourceReqDto } from '../dto/index-source.req.dto';
import { ResolveSourcesReqDto } from '../dto/resolve-sources.req.dto';
import { ResolvedSourceResDto } from '../dto/resolved-source.res.dto';
import { SourceType } from '../enums/source-type.enum';
import { IndexingHelperService } from '../services/indexing-helper.service';
import { IndexingService } from '../services/indexing.service';
import { SourceResolverService } from '../services/source-resolver.service';

@ApiTags('rag/indexing')
@Controller({
  path: 'rag/index',
  version: '1',
})
export class IndexingController {
  constructor(
    private readonly indexingService: IndexingService,
    private readonly indexingHelperService: IndexingHelperService,
    private readonly sourceResolverService: SourceResolverService,
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

  @Post('custom')
  @ApiAuth({
    type: EmbeddingSourceResDto,
    summary: 'Index custom content for RAG',
  })
  async indexCustom(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: IndexCustomSourceReqDto,
  ): Promise<EmbeddingSourceResDto> {
    const sourceId = uuidv4() as Uuid;
    const source = await this.indexingService.indexRecord(
      userId,
      SourceType.CUSTOM,
      sourceId,
      reqDto.content,
      reqDto.metadata,
    );

    return this.toResDto(source);
  }

  @Put('custom/:sourceId')
  @ApiAuth({
    type: EmbeddingSourceResDto,
    summary: 'Update a custom RAG source',
  })
  @ApiParam({ name: 'sourceId', type: 'String' })
  async updateCustom(
    @CurrentUser('id') userId: Uuid,
    @Param('sourceId', ParseUUIDPipe) sourceId: Uuid,
    @Body() reqDto: IndexCustomSourceReqDto,
  ): Promise<EmbeddingSourceResDto> {
    const source = await this.indexingService.findSource(sourceId);

    if (source.userId !== userId) {
      throw new ForbiddenException('Access denied to this source');
    }

    if (source.sourceType !== SourceType.CUSTOM) {
      throw new BadRequestException('Only custom sources can be updated');
    }

    const updated = await this.indexingService.indexRecord(
      userId,
      SourceType.CUSTOM,
      source.sourceId,
      reqDto.content,
      reqDto.metadata ?? source.metadata,
    );

    return this.toResDto(updated);
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

  @Post('resolve')
  @ApiAuth({
    type: ResolvedSourceResDto,
    summary: 'Resolve embedding sources to original records',
  })
  async resolveSources(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: ResolveSourcesReqDto,
  ): Promise<ResolvedSourceResDto[]> {
    const resolved = await this.sourceResolverService.resolveSources(
      userId,
      reqDto.sourceIds as Uuid[],
    );

    return resolved.map((item) => ({
      embeddingSourceId: item.embeddingSourceId,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      title: item.title,
      projectId: item.projectId,
      slug: item.slug,
      metadata: item.metadata,
    }));
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
      throw new ForbiddenException('Access denied to this source');
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
