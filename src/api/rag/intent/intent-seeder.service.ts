import { Injectable, Logger } from '@nestjs/common';
import { AiIntentExampleRepository } from '../repositories/ai-intent-example.repository';
import { EmbeddingService } from '../services/embedding.service';
import { INTENT_EXAMPLES } from './intent-examples';

@Injectable()
export class IntentSeederService {
  private readonly logger = new Logger(IntentSeederService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly intentExampleRepository: AiIntentExampleRepository,
  ) {}

  async seed(): Promise<void> {
    let created = 0;
    let skipped = 0;

    for (const [intent, examples] of Object.entries(INTENT_EXAMPLES)) {
      for (const text of examples) {
        const existing =
          await this.intentExampleRepository.findOneByIntentAndText(
            intent as any,
            text,
          );

        if (existing) {
          skipped += 1;
          continue;
        }

        const embedding = await this.embeddingService.embedSingle(text);
        await this.intentExampleRepository.save(
          this.intentExampleRepository.create({
            intent: intent as any,
            text,
            embedding,
          }),
        );
        created += 1;
      }
    }

    this.logger.log(
      `Intent examples seeded: created=${created}, skipped=${skipped}`,
    );
  }
}
