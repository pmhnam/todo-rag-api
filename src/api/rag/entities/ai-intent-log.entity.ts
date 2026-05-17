import { Uuid } from '@/common/types/common.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiIntent } from '../enums/ai-intent.enum';
import { IntentNearestExample } from '../types/intent-classification.type';

@Entity('ai_intent_logs')
export class AiIntentLogEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_ai_intent_logs_id',
  })
  id!: Uuid;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: Uuid;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'predicted_intent', type: 'varchar' })
  predictedIntent!: AiIntent;

  @Column({ type: 'double precision', nullable: true })
  confidence?: number;

  @Column({ name: 'nearest_examples', type: 'jsonb', nullable: true })
  nearestExamples?: IntentNearestExample[];

  @Column({ name: 'final_tool_called', type: 'varchar', nullable: true })
  finalToolCalled?: string;

  @Column({ type: 'boolean', default: false })
  accepted!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
