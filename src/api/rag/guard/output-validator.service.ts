import { Injectable } from '@nestjs/common';
import { AiIntent } from '../enums/ai-intent.enum';

export const TODO_SCOPE_REFUSAL =
  'Xin lỗi, tôi chỉ có thể hỗ trợ các tác vụ liên quan đến task, project, comment, tag, status và dashboard trong hệ thống này.';

@Injectable()
export class OutputValidatorService {
  validate(params: { response: string; intent: AiIntent }): {
    valid: boolean;
    response: string;
  } {
    if (params.intent === AiIntent.OUT_OF_SCOPE) {
      return { valid: false, response: TODO_SCOPE_REFUSAL };
    }

    const normalized = params.response.toLowerCase();
    const forbiddenPatterns = [
      /```\s*(html|css|js|javascript|typescript|tsx|jsx|python)/,
      /<html[\s>]/,
      /<script[\s>]/,
      /import\s+react/,
      /function\s+[a-z0-9_]+\s*\(/,
      /const\s+[a-z0-9_]+\s*=/,
    ];

    if (forbiddenPatterns.some((rule) => rule.test(normalized))) {
      return { valid: false, response: TODO_SCOPE_REFUSAL };
    }

    return { valid: true, response: params.response };
  }
}
