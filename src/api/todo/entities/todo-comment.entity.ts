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
import { TodoEntity } from './todo.entity';

@Entity('todo_comment')
export class TodoCommentEntity extends AbstractEntity {
  constructor(data?: Partial<TodoCommentEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_todo_comment_id',
  })
  id!: Uuid;

  @Column({ name: 'todo_id' })
  todoId!: Uuid;

  @JoinColumn({
    name: 'todo_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_comment_todo_id',
  })
  @ManyToOne(() => TodoEntity)
  todo: Relation<TodoEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_comment_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
