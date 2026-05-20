import type { JiraIntegrationEntity } from '@/api/jira-integration/entities/jira-integration.entity';
import type { PostEntity } from '@/api/post/entities/post.entity';
import type { ProjectMemberEntity } from '@/api/project/entities/project-member.entity';
import type { ProjectEntity } from '@/api/project/entities/project.entity';
import type { TodoStatusEntity } from '@/api/todo/entities/todo-status.entity';
import type { TodoEntity } from '@/api/todo/entities/todo.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { hashPassword as hashPass } from '@/utils/password.util';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import type { SessionEntity } from './session.entity';

@Entity('user')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_id' })
  id!: Uuid;

  @Column({
    length: 50,
    nullable: true,
  })
  @Index('UQ_user_username', {
    where: '"deleted_at" IS NULL',
    unique: true,
  })
  username: string;

  @Column()
  @Index('UQ_user_email', { where: '"deleted_at" IS NULL', unique: true })
  email!: string;

  @Column({ length: 100 })
  name!: string;

  @Column()
  password!: string;

  @Column({ default: '' })
  bio?: string;

  @Column({ default: '' })
  image?: string;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;

  @OneToMany('SessionEntity', (session: SessionEntity) => session.user)
  sessions?: SessionEntity[];

  @OneToMany('PostEntity', (post: PostEntity) => post.user)
  posts: Relation<PostEntity[]>;

  @OneToMany('ProjectEntity', (project: ProjectEntity) => project.user)
  projects: Relation<ProjectEntity[]>;

  @OneToMany(
    'ProjectMemberEntity',
    (membership: ProjectMemberEntity) => membership.user,
  )
  projectMemberships: Relation<ProjectMemberEntity[]>;

  @OneToMany('TodoEntity', (todo: TodoEntity) => todo.user)
  todos: Relation<TodoEntity[]>;

  @OneToMany('TodoEntity', (todo: TodoEntity) => todo.assignee)
  assignedTodos: Relation<TodoEntity[]>;

  @OneToMany('TodoStatusEntity', (status: TodoStatusEntity) => status.user)
  todoStatuses: Relation<TodoStatusEntity[]>;

  @OneToMany(
    'JiraIntegrationEntity',
    (jira: JiraIntegrationEntity) => jira.user,
  )
  jiraIntegrations: Relation<JiraIntegrationEntity[]>;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await hashPass(this.password);
    }
  }
}
