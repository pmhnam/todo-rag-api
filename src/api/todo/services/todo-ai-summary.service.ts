import { LlmService } from '@/api/rag/services/llm.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TodoAiSummaryService {
  private readonly logger = new Logger(TodoAiSummaryService.name);

  constructor(private readonly llmService: LlmService) {}

  async generate(
    title?: string,
    description?: string,
  ): Promise<string | undefined> {
    if (!title || !description) return undefined;

    try {
      const prompt = `Bạn là một trợ lý ảo thông minh. Hãy tóm tắt ngắn gọn (trong khoảng 1-2 câu) mục tiêu của công việc sau. Tên công việc: "${title}". Mô tả chi tiết: "${description}". Trả về trực tiếp phần tóm tắt, không giải thích gì thêm.`;
      const res = await this.llmService.generate(prompt);

      return res.content?.trim();
    } catch (err) {
      this.logger.warn(
        `Failed to generate AI summary for todo: ${err.message}`,
      );
      return undefined;
    }
  }
}
