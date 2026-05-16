import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TodoActivityType } from '../enums/todo-activity-type.enum';
import { TodoEntity } from './todo.entity';

@Entity('todo_activity')
export class TodoActivityEntity extends AbstractEntity {
  constructor(data?: Partial<TodoActivityEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_todo_activity_id',
  })
  id!: Uuid;

  @Column({ name: 'todo_id' })
  todoId!: Uuid;

  @JoinColumn({
    name: 'todo_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_activity_todo_id',
  })
  @ManyToOne(() => TodoEntity)
  todo: Relation<TodoEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_activity_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ name: 'type', type: 'enum', enum: TodoActivityType })
  type!: TodoActivityType;

  @Column({ name: 'message', length: 500 })
  message!: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
