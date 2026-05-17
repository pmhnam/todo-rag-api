import { AiIntent } from '../enums/ai-intent.enum';
import {
  OutputValidatorService,
  TODO_SCOPE_REFUSAL,
} from './output-validator.service';

describe('OutputValidatorService', () => {
  let service: OutputValidatorService;

  beforeEach(() => {
    service = new OutputValidatorService();
  });

  it('passes todo scoped response', () => {
    expect(
      service.validate({
        intent: AiIntent.TASK_SEARCH,
        response: 'Bạn có 3 task đang làm.',
      }),
    ).toEqual({ valid: true, response: 'Bạn có 3 task đang làm.' });
  });

  it('replaces generated code with refusal', () => {
    expect(
      service.validate({
        intent: AiIntent.TASK_SEARCH,
        response: '```html\n<html></html>\n```',
      }),
    ).toEqual({ valid: false, response: TODO_SCOPE_REFUSAL });
  });
});
