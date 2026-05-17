import { Injectable } from '@nestjs/common';
import { AiIntent } from '../enums/ai-intent.enum';
import { IntentClassification } from '../types/intent-classification.type';

@Injectable()
export class RuleBasedGuardService {
  check(message: string): IntentClassification | null {
    const normalized = this.normalize(message);

    const todoLikePatterns = [
      /task/,
      /todo/,
      /cong viec/,
      /viec/,
      /nhac toi/,
      /nho/,
      /remind me/,
      /deadline/,
      /project/,
      /board/,
      /comment/,
      /ghi chu/,
      /tag/,
      /label/,
      /status/,
      /trang thai/,
      /dashboard/,
      /thong ke/,
      /tien do/,
    ];

    const outOfScopePatterns = [
      /viet.*html/,
      /landing page/,
      /react component/,
      /code giup/,
      /viet.*code/,
      /dich.*sang/,
      /translate/,
      /viet.*email/,
      /blog post/,
      /essay/,
      /giai toan/,
      /gia bitcoin/,
      /thoi tiet/,
    ];

    const isTodoLike = todoLikePatterns.some((rule) => rule.test(normalized));
    const isOutOfScope = outOfScopePatterns.some((rule) =>
      rule.test(normalized),
    );

    if (isOutOfScope && !isTodoLike) {
      return {
        intent: AiIntent.OUT_OF_SCOPE,
        confidence: 0.99,
        reason: 'Matched obvious out-of-scope pattern.',
      };
    }

    return null;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s#/_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
