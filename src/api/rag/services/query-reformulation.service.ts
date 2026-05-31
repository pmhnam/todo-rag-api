import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';

@Injectable()
export class QueryReformulationService {
  private readonly logger = new Logger(QueryReformulationService.name);

  constructor(private readonly llmService: LlmService) {}

  async rewrite(query: string): Promise<string> {
    const trimmed = query.trim();
    if (!trimmed) return query;

    const prompt = [
      'Rewrite the user query into a short search query for vector retrieval.',
      'Keep key nouns and phrases, remove filler words.',
      'Return only the rewritten query, no quotes or extra text.',
      '',
      `User query: ${trimmed}`,
    ].join('\n');

    try {
      const response = await this.llmService.generate(prompt, {
        temperature: 0.2,
        maxTokens: 128,
      });
      const rewritten = this.normalize(response.content);
      if (!rewritten) return query;
      if (rewritten.toLowerCase() === trimmed.toLowerCase()) return query;
      return rewritten;
    } catch (error: any) {
      this.logger.warn(`Query rewrite failed: ${error.message}`);
      return query;
    }
  }

  private normalize(text: string): string {
    const cleaned = text.trim();
    if (!cleaned) return '';

    const line = cleaned
      .split('\n')
      .map((item) => item.trim())
      .find((item) => item.length > 0);
    if (!line) return '';

    let value = line.replace(/^Rewritten query:\s*/i, '');
    value = value.replace(/^[-*]\s+/, '');
    value = value.replace(/^"|"$/g, '');
    value = value.replace(/^'|'$/g, '');
    return value.trim();
  }
}
