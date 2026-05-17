import { Uuid } from '@/common/types/common.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiIntent } from '../enums/ai-intent.enum';

@Entity('ai_intent_examples')
@Index('UQ_ai_intent_examples_intent_text', ['intent', 'text'], {
  unique: true,
})
export class AiIntentExampleEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_ai_intent_examples_id',
  })
  id!: Uuid;

  @Column({ type: 'varchar' })
  intent!: AiIntent;

  @Column({ type: 'text' })
  text!: string;

  @Column({
    type: 'text',
    transformer: {
      to: (value: number[] | null) => (value ? `[${value.join(',')}]` : null),
      from: (value: string | null) =>
        value
          ? value
              // eslint-disable-next-line no-useless-escape
              .replace(/[\[\]]/g, '')
              .split(',')
              .map(Number)
          : null,
    },
  })
  embedding!: number[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
