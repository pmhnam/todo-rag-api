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
import { EmbeddingStatus } from '../enums/embedding-status.enum';
import { SourceType } from '../enums/source-type.enum';
import { EmbeddingChunkEntity } from './embedding-chunk.entity';

@Entity('embedding_source')
@Index('UQ_embedding_source_type_id', ['sourceType', 'sourceId'], {
  unique: true,
})
@Index('IDX_embedding_source_user_type', ['userId', 'sourceType'])
export class EmbeddingSourceEntity extends AbstractEntity {
  constructor(data?: Partial<EmbeddingSourceEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_embedding_source_id',
  })
  id!: Uuid;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_embedding_source_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: SourceType,
  })
  sourceType!: SourceType;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId!: Uuid;

  @Column({ name: 'content_hash', length: 64 })
  contentHash!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EmbeddingStatus,
    default: EmbeddingStatus.PENDING,
  })
  status!: EmbeddingStatus;

  @OneToMany(() => EmbeddingChunkEntity, (chunk) => chunk.source, {
    cascade: true,
  })
  chunks: Relation<EmbeddingChunkEntity[]>;
}
