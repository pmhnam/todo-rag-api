import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
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
import { WorkspaceInvitationStatus } from '../enums/workspace-invitation-status.enum';
import { WorkspaceEntity } from './workspace.entity';

@Entity('workspace_invitation')
@Index('IDX_workspace_invitation_token_hash', ['tokenHash'])
@Index('IDX_workspace_invitation_workspace_status', ['workspaceId', 'status'])
@Index('UQ_workspace_invitation_pending_email', ['workspaceId', 'email'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
export class WorkspaceInvitationEntity extends AbstractEntity {
  constructor(data?: Partial<WorkspaceInvitationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workspace_invitation_id',
  })
  id!: Uuid;

  @Column({ name: 'workspace_id' })
  workspaceId!: Uuid;

  @JoinColumn({
    name: 'workspace_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_workspace_invitation_workspace_id',
  })
  @ManyToOne(() => WorkspaceEntity)
  workspace: Relation<WorkspaceEntity>;

  @Column({ name: 'email' })
  email!: string;

  @Column({ name: 'permission', type: 'enum', enum: ProjectMemberPermission })
  permission!: ProjectMemberPermission;

  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: WorkspaceInvitationStatus,
    default: WorkspaceInvitationStatus.PENDING,
  })
  status!: WorkspaceInvitationStatus;

  @Column({ name: 'invited_by' })
  invitedBy!: Uuid;

  @JoinColumn({
    name: 'invited_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_workspace_invitation_invited_by',
  })
  @ManyToOne(() => UserEntity)
  inviter: Relation<UserEntity>;

  @Column({ name: 'accepted_by', type: 'uuid', nullable: true })
  acceptedBy?: Uuid;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
