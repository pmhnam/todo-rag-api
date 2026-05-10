import { UserEntity } from '@/api/user/entities/user.entity';
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
import { EmbeddingSourceEntity } from './embedding-source.entity';

@Entity('embedding_chunk')
@Index('IDX_embedding_chunk_user_id', ['userId'])
@Index('IDX_embedding_chunk_source_id', ['sourceId'])
export class EmbeddingChunkEntity {
  constructor(data?: Partial<EmbeddingChunkEntity>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_embedding_chunk_id',
  })
  id!: Uuid;

  @Column({ name: 'source_id' })
  sourceId!: Uuid;

  @JoinColumn({
    name: 'source_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_embedding_chunk_source_id',
  })
  @ManyToOne(() => EmbeddingSourceEntity, (source) => source.chunks, {
    onDelete: 'CASCADE',
  })
  source: Relation<EmbeddingSourceEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_embedding_chunk_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex!: number;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount?: number;

  // Vector column — actual DB type is vector(1024) created via migration.
  // TypeORM treats it as text with a transformer for serialization.
  @Column({
    type: 'text',
    nullable: true,
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
  embedding?: number[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
