import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { RagMessageEntity } from './rag-message.entity';

@Entity('rag_conversation')
@Index('IDX_rag_conversation_user_id', ['userId'])
export class RagConversationEntity extends AbstractEntity {
  constructor(data?: Partial<RagConversationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_rag_conversation_id',
  })
  id!: Uuid;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_rag_conversation_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ name: 'title', length: 255, nullable: true })
  title?: string;

  @OneToMany(() => RagMessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages: Relation<RagMessageEntity[]>;
}
