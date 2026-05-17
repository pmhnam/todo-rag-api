import { AiIntent } from '../enums/ai-intent.enum';

export type IntentNearestExample = {
  intent: AiIntent;
  text: string;
  distance: number;
  similarity: number;
};

export type IntentClassification = {
  intent: AiIntent;
  confidence: number;
  reason: string;
  nearest?: IntentNearestExample[];
};
