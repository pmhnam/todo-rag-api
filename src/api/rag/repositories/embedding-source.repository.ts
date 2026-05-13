import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { EmbeddingSourceEntity } from '../entities/embedding-source.entity';
import { EmbeddingStatus } from '../enums/embedding-status.enum';
import { SourceType } from '../enums/source-type.enum';

@Injectable()
export class EmbeddingSourceRepository {
  constructor(
    @InjectRepository(EmbeddingSourceEntity)
    private readonly repository: Repository<EmbeddingSourceEntity>,
  ) {}

  findBySource(
    sourceType: SourceType,
    sourceId: Uuid,
  ): Promise<EmbeddingSourceEntity | null> {
    return this.repository.findOne({ where: { sourceType, sourceId } });
  }

  findById(sourceId: Uuid): Promise<EmbeddingSourceEntity | null> {
    return this.repository.findOne({ where: { id: sourceId } });
  }

  findManyOwned(
    userId: Uuid,
    sourceType?: SourceType,
  ): Promise<EmbeddingSourceEntity[]> {
    const where: FindOptionsWhere<EmbeddingSourceEntity> = { userId };
    if (sourceType) {
      where.sourceType = sourceType;
    }

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  create(data: Partial<EmbeddingSourceEntity>): EmbeddingSourceEntity {
    return this.repository.create(data);
  }

  save(source: EmbeddingSourceEntity): Promise<EmbeddingSourceEntity> {
    return this.repository.save(source);
  }

  async remove(source: EmbeddingSourceEntity): Promise<void> {
    await this.repository.remove(source);
  }

  async updateStatus(sourceId: Uuid, status: EmbeddingStatus): Promise<void> {
    await this.repository.update(sourceId, { status });
  }
}
