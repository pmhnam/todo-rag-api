import { TodoStatusEntity } from '@/api/todo/entities/todo-status.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
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
import { ProjectMemberEntity } from './project-member.entity';

@Entity('project')
export class ProjectEntity extends AbstractEntity {
  constructor(data?: Partial<ProjectEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_project_id' })
  id!: Uuid;

  @Column({ name: 'name', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_user_id',
  })
  @ManyToOne(() => UserEntity, (user) => user.projects)
  user: Relation<UserEntity>;

  @OneToMany(() => TodoStatusEntity, (status) => status.project)
  todoStatuses: Relation<TodoStatusEntity[]>;

  @OneToMany(() => TodoEntity, (todo) => todo.project)
  todos: Relation<TodoEntity[]>;

  @OneToMany(() => ProjectMemberEntity, (member) => member.project)
  members: Relation<ProjectMemberEntity[]>;

  @Column({ name: 'settings', type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
