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

  it.each(['Tạo todo học HTML', 'Nhắc tôi học React'])(
    'does not block todo-like edge case: %s',
    (message) => {
      expect(service.check(message)).toBeNull();
    },
  );
});
