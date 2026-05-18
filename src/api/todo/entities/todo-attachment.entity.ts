import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TodoAttachmentKind } from '../enums/todo-attachment-kind.enum';
import { TodoCommentEntity } from './todo-comment.entity';
import { TodoEntity } from './todo.entity';

@Entity('todo_attachment')
export class TodoAttachmentEntity extends AbstractEntity {
  constructor(data?: Partial<TodoAttachmentEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_todo_attachment_id',
  })
  id!: Uuid;

  @Column({ name: 'todo_id' })
  todoId!: Uuid;

  @JoinColumn({
    name: 'todo_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_attachment_todo_id',
  })
  @ManyToOne(() => TodoEntity, (todo) => todo.attachments)
  todo: Relation<TodoEntity>;

  @Column({ name: 'comment_id', nullable: true })
  commentId?: Uuid;

  @JoinColumn({
    name: 'comment_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_attachment_comment_id',
  })
  @ManyToOne(() => TodoCommentEntity, (comment) => comment.attachments)
  comment?: Relation<TodoCommentEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_attachment_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ name: 'kind', type: 'enum', enum: TodoAttachmentKind })
  kind!: TodoAttachmentKind;

  @Column({ name: 'storage_key', length: 700, unique: true })
  storageKey!: string;

  @Column({ name: 'url', length: 1000 })
  url!: string;

  @Column({ name: 'original_name', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'size', type: 'bigint' })
  size!: number;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
