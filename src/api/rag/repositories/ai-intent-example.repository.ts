import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiIntentExampleEntity } from '../entities/ai-intent-example.entity';
import { AiIntent } from '../enums/ai-intent.enum';
import { IntentNearestExample } from '../types/intent-classification.type';

@Injectable()
export class AiIntentExampleRepository {
  constructor(
    @InjectRepository(AiIntentExampleEntity)
    private readonly repository: Repository<AiIntentExampleEntity>,
  ) {}

  async findNearest(
    embedding: number[],
    limit = 8,
  ): Promise<IntentNearestExample[]> {
    const queryEmbedding = `[${embedding.join(',')}]`;
    const rows = await this.repository
      .createQueryBuilder('example')
      .select('example.intent', 'intent')
      .addSelect('example.text', 'text')
      .addSelect(
        'example.embedding <=> CAST(:queryEmbedding AS vector)',
        'distance',
      )
      .addSelect(
        '1 - (example.embedding <=> CAST(:queryEmbedding AS vector))',
        'similarity',
      )
      .orderBy('example.embedding <=> CAST(:queryEmbedding AS vector)', 'ASC')
      .setParameter('queryEmbedding', queryEmbedding)
      .limit(limit)
      .getRawMany<{
        intent: AiIntent;
        text: string;
        distance: string;
        similarity: string;
      }>();

    return rows.map((row) => ({
      intent: row.intent,
      text: row.text,
      distance: Number(row.distance),
      similarity: Number(row.similarity),
    }));
  }

  findOneByIntentAndText(
    intent: AiIntent,
    text: string,
  ): Promise<AiIntentExampleEntity | null> {
    return this.repository.findOne({ where: { intent, text } });
  }

  create(data: Partial<AiIntentExampleEntity>): AiIntentExampleEntity {
    return this.repository.create(data);
  }

  save(entity: AiIntentExampleEntity): Promise<AiIntentExampleEntity> {
    return this.repository.save(entity);
  }
}
