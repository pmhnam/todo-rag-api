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
  Unique,
} from 'typeorm';
import { TodoStatusEntity } from '../../todo/entities/todo-status.entity';
import { JiraIntegrationEntity } from './jira-integration.entity';

@Entity('jira_status_mapping')
@Unique('UQ_jira_status_mapping', ['todoStatusId', 'jiraIntegrationId'])
export class JiraStatusMappingEntity extends AbstractEntity {
  constructor(data?: Partial<JiraStatusMappingEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_jira_status_mapping_id',
  })
  id!: Uuid;

  @Column({ name: 'todo_status_id' })
  todoStatusId!: Uuid;

  @JoinColumn({
    name: 'todo_status_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_jira_status_mapping_todo_status_id',
  })
  @ManyToOne(() => TodoStatusEntity)
  todoStatus: Relation<TodoStatusEntity>;

  @Column({ name: 'jira_status_id', length: 100 })
  jiraStatusId!: string;

  @Column({ name: 'jira_status_name', length: 100, nullable: true })
  jiraStatusName?: string;

  @Column({ name: 'jira_integration_id' })
  jiraIntegrationId!: Uuid;

  @JoinColumn({
    name: 'jira_integration_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_jira_status_mapping_jira_integration_id',
  })
  @ManyToOne(
    () => JiraIntegrationEntity,
    (integration) => integration.statusMappings,
  )
  jiraIntegration: Relation<JiraIntegrationEntity>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
