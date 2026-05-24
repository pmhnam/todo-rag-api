import { AiIntent } from '../enums/ai-intent.enum';
import { RuleBasedGuardService } from './rule-based-guard.service';

describe('RuleBasedGuardService', () => {
  let service: RuleBasedGuardService;

  beforeEach(() => {
    service = new RuleBasedGuardService();
  });

  it.each([
    'Viết cho tôi trang HTML',
    'Làm landing page bằng React',
    'Dịch đoạn này sang tiếng Anh',
  ])('blocks obvious out-of-scope message: %s', (message) => {
    expect(service.check(message)).toMatchObject({
      intent: AiIntent.OUT_OF_SCOPE,
    });
  });

  it.each(['Tạo todo học HTML', 'Add task to review React SSO flow'])(
    'classifies explicit task creation: %s',
    (message) => {
      expect(service.check(message)).toMatchObject({
        intent: AiIntent.TASK_CREATE,
      });
    },
  );

  it.each([
    'Tạo standup hôm nay',
    'Generate daily standup',
    'Liệt kê risks và next actions',
    'Rủi ro hiện tại và hành động tiếp theo là gì',
  ])('classifies standup report request: %s', (message) => {
    expect(service.check(message)).toMatchObject({
      intent: AiIntent.STANDUP_REPORT,
      confidence: 0.99,
    });
  });

  it('does not block todo-like edge case', () => {
    expect(service.check('Nhắc tôi học React')).toBeNull();
  });

  it('classifies explicit task creation with technical content', () => {
    expect(
      service.check(
        'Tạo task để refactor module users, đặt title sao cho hay bằng tiếng anh, viết description là thêm field name và hỗ trợ SSO login',
      ),
    ).toMatchObject({
      intent: AiIntent.TASK_CREATE,
      confidence: 0.99,
    });
  });
});
