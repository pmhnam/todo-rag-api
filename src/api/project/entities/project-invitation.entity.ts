import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ProjectInvitationStatus } from '../enums/project-invitation-status.enum';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';
import { ProjectEntity } from './project.entity';

@Entity('project_invitation')
@Index('IDX_project_invitation_token_hash', ['tokenHash'])
@Index('IDX_project_invitation_project_status', ['projectId', 'status'])
@Index('UQ_project_invitation_pending_email', ['projectId', 'email'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
export class ProjectInvitationEntity extends AbstractEntity {
  constructor(data?: Partial<ProjectInvitationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_project_invitation_id',
  })
  id!: Uuid;

  @Column({ name: 'project_id' })
  projectId!: Uuid;

  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_invitation_project_id',
  })
  @ManyToOne(() => ProjectEntity)
  project: Relation<ProjectEntity>;

  @Column({ name: 'email' })
  email!: string;

  @Column({
    name: 'permission',
    type: 'enum',
    enum: ProjectMemberPermission,
  })
  permission!: ProjectMemberPermission;

  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProjectInvitationStatus,
    default: ProjectInvitationStatus.PENDING,
  })
  status!: ProjectInvitationStatus;

  @Column({ name: 'invited_by' })
  invitedBy!: Uuid;

  @JoinColumn({
    name: 'invited_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_invitation_invited_by',
  })
  @ManyToOne(() => UserEntity)
  inviter: Relation<UserEntity>;

  @Column({ name: 'accepted_by', nullable: true })
  acceptedBy?: Uuid;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
