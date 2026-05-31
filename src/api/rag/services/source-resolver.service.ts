import { Uuid } from '@/common/types/common.type';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmbeddingSourceEntity } from '../entities/embedding-source.entity';
import { SourceType } from '../enums/source-type.enum';
import { EmbeddingSourceRepository } from '../repositories/embedding-source.repository';
import { IndexingHelperService } from './indexing-helper.service';

export type ResolvedSource = {
  embeddingSourceId: Uuid;
  sourceType: SourceType;
  sourceId: Uuid;
  title?: string;
  projectId?: Uuid;
  slug?: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class SourceResolverService {
  constructor(
    private readonly sourceRepository: EmbeddingSourceRepository,
    private readonly indexingHelperService: IndexingHelperService,
  ) {}

  async resolveSources(
    userId: Uuid,
    sourceIds: Uuid[],
  ): Promise<ResolvedSource[]> {
    const sources = await this.sourceRepository.findManyByIds(sourceIds);
    const sourceMap = new Map(sources.map((source) => [source.id, source]));

    const missing = sourceIds.filter((id) => !sourceMap.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Embedding sources not found: ${missing.join(', ')}`,
      );
    }

    for (const source of sources) {
      if (source.userId !== userId) {
        throw new ForbiddenException('Access denied to embedding source');
      }
    }

    const resolved: ResolvedSource[] = [];
    for (const sourceId of sourceIds) {
      const source = sourceMap.get(sourceId) as EmbeddingSourceEntity;

      let title = source.metadata?.title as string | undefined;
      let projectId: Uuid | undefined;
      let slug: string | undefined;

      if (source.sourceType !== SourceType.CUSTOM) {
        const summary = await this.indexingHelperService.getRecordSummary(
          source.sourceType,
          source.sourceId,
          userId,
        );
        title = summary.title ?? title;
        projectId = summary.projectId;
        slug = summary.slug;
      }

      resolved.push({
        embeddingSourceId: source.id,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        title,
        projectId,
        slug,
        metadata: source.metadata,
      });
    }

    return resolved;
  }
}
