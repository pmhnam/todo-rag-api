import { Uuid } from '@/common/types/common.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { RagConversationEntity } from './rag-conversation.entity';

@Entity('rag_message')
@Index('IDX_rag_message_conversation_id', ['conversationId'])
export class RagMessageEntity {
  constructor(data?: Partial<RagMessageEntity>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_rag_message_id',
  })
  id!: Uuid;

  @Column({ name: 'conversation_id' })
  conversationId!: Uuid;

  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_rag_message_conversation_id',
  })
  @ManyToOne(() => RagConversationEntity, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Relation<RagConversationEntity>;

  @Column({ name: 'role', length: 20 })
  role!: string; // 'user' | 'assistant' | 'system'

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'context_chunks', type: 'jsonb', nullable: true })
  contextChunks?: Record<string, any>[];

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
