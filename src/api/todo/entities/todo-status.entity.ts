import { ProjectEntity } from '@/api/project/entities/project.entity';
import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TodoEntity } from './todo.entity';

@Entity('todo_status')
export class TodoStatusEntity extends AbstractEntity {
  constructor(data?: Partial<TodoStatusEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_todo_status_id',
  })
  id!: Uuid;

  @Column({ name: 'name', length: 100 })
  name!: string;

  @Column({ name: 'order', type: 'int', default: 0 })
  order!: number;

  @Column({ name: 'color', length: 20, nullable: true })
  color?: string;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_status_user_id',
  })
  @ManyToOne(() => UserEntity, (user) => user.todoStatuses)
  user: Relation<UserEntity>;

  @Column({ name: 'project_id', nullable: true })
  projectId?: Uuid;

  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_status_project_id',
  })
  @ManyToOne(() => ProjectEntity, (project) => project.todoStatuses)
  project: Relation<ProjectEntity>;

  @OneToMany(() => TodoEntity, (todo) => todo.status)
  todos: Relation<TodoEntity[]>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
