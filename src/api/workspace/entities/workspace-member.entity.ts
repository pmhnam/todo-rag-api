import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
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
  Unique,
} from 'typeorm';
import { WorkspaceEntity } from './workspace.entity';

@Entity('workspace_member')
@Unique('UQ_workspace_member_workspace_user', ['workspaceId', 'userId'])
export class WorkspaceMemberEntity extends AbstractEntity {
  constructor(data?: Partial<WorkspaceMemberEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workspace_member_id',
  })
  id!: Uuid;

  @Column({ name: 'workspace_id' })
  workspaceId!: Uuid;

  @JoinColumn({
    name: 'workspace_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_workspace_member_workspace_id',
  })
  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.members)
  workspace: Relation<WorkspaceEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_workspace_member_user_id',
  })
  @ManyToOne(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({
    name: 'permission',
    type: 'enum',
    enum: ProjectMemberPermission,
    default: ProjectMemberPermission.READ,
  })
  permission!: ProjectMemberPermission;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: Uuid;
}
