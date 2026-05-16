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
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ExternalLinkDto } from '../dto/create-todo.req.dto';
import { JiraSyncStatus } from '../enums/jira-sync-status.enum';
import { TodoPriority } from '../enums/todo-priority.enum';
import { TodoStatusEntity } from './todo-status.entity';

@Entity('todo')
export class TodoEntity extends AbstractEntity {
  constructor(data?: Partial<TodoEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_todo_id' })
  id!: Uuid;

  @Column({ name: 'title', length: 255 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'status_id' })
  statusId!: Uuid;

  @JoinColumn({
    name: 'status_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_status_id',
  })
  @ManyToOne(() => TodoStatusEntity, (status) => status.todos)
  status: Relation<TodoStatusEntity>;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: TodoPriority,
    default: TodoPriority.MEDIUM,
  })
  priority!: TodoPriority;

  @Column({ name: 'position', type: 'int', default: 0 })
  position!: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_user_id',
  })
  @ManyToOne(() => UserEntity, (user) => user.todos)
  user: Relation<UserEntity>;

  @Column({ name: 'project_id', nullable: true })
  projectId?: Uuid;

  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_todo_project_id',
  })
  @ManyToOne(() => ProjectEntity, (project) => project.todos)
  project: Relation<ProjectEntity>;

  // --- Jira Integration Fields ---

  @Column({ name: 'jira_issue_id', length: 50, nullable: true })
  jiraIssueId?: string;

  @Column({ name: 'jira_issue_key', length: 50, nullable: true })
  jiraIssueKey?: string;

  @Column({ name: 'jira_issue_url', length: 500, nullable: true })
  jiraIssueUrl?: string;

  @Column({
    name: 'jira_sync_status',
    type: 'enum',
    enum: JiraSyncStatus,
    default: JiraSyncStatus.NOT_LINKED,
  })
  jiraSyncStatus!: JiraSyncStatus;

  @Column({ name: 'jira_last_synced_at', type: 'timestamptz', nullable: true })
  jiraLastSyncedAt?: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;

  @Column({ name: 'tags', type: 'varchar', array: true, nullable: true })
  tags?: string[];

  @Column({ name: 'external_links', type: 'jsonb', nullable: true })
  externalLinks?: ExternalLinkDto[];

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary?: string;

  @Column({
    name: 'generated_by_ai',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  generatedByAi?: boolean;
}
