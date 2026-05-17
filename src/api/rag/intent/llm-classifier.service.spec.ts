import { AiIntent } from '../enums/ai-intent.enum';
import { LlmService } from '../services/llm.service';
import { LlmClassifierService } from './llm-classifier.service';

describe('LlmClassifierService', () => {
  let service: LlmClassifierService;
  let llmService: jest.Mocked<Pick<LlmService, 'generate'>>;

  beforeEach(() => {
    llmService = {
      generate: jest.fn(),
    };
    service = new LlmClassifierService(llmService as any);
  });

  it.each([
    ['Tạo task mua sữa lúc 8h tối', AiIntent.TASK_CREATE],
    ['Nhắc tôi deploy backend tối nay', AiIntent.TASK_CREATE],
    ['Tìm các todo quá hạn', AiIntent.TASK_SEARCH],
    ['Xóa task mua sữa', AiIntent.TASK_DELETE],
    ['Đổi task login sang done', AiIntent.STATUS_UPDATE],
    ['Gắn tag urgent cho task deploy', AiIntent.TAG_MANAGE],
    ['Comment task này là cần fix gấp', AiIntent.COMMENT_CREATE],
    ['Thống kê task tuần này', AiIntent.DASHBOARD_QUERY],
  ])('returns allowed intent for %s', async (message, intent) => {
    llmService.generate.mockResolvedValueOnce({
      content: JSON.stringify({ intent, confidence: 0.9, reason: 'test' }),
      model: 'test',
    });

    await expect(service.classify(message)).resolves.toMatchObject({ intent });
  });

  it.each([
    'Viết cho tôi trang HTML',
    'Làm landing page bằng React',
    'Dịch đoạn này sang tiếng Anh',
  ])('returns OUT_OF_SCOPE for %s', async (message) => {
    llmService.generate.mockResolvedValueOnce({
      content: JSON.stringify({
        intent: AiIntent.OUT_OF_SCOPE,
        confidence: 0.95,
        reason: 'test',
      }),
      model: 'test',
    });

    await expect(service.classify(message)).resolves.toMatchObject({
      intent: AiIntent.OUT_OF_SCOPE,
    });
  });

  it('returns AMBIGUOUS when model output is invalid', async () => {
    llmService.generate.mockResolvedValueOnce({
      content: 'not json',
      model: 'test',
    });

    await expect(service.classify('abc')).resolves.toMatchObject({
      intent: AiIntent.AMBIGUOUS,
    });
  });
});
