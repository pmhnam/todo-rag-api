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
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';
import { ProjectEntity } from './project.entity';

@Entity('project_member')
@Unique('UQ_project_member_project_user', ['projectId', 'userId'])
export class ProjectMemberEntity extends AbstractEntity {
  constructor(data?: Partial<ProjectMemberEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_project_member_id',
  })
  id!: Uuid;

  @Column({ name: 'project_id' })
  projectId!: Uuid;

  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_member_project_id',
  })
  @ManyToOne(() => ProjectEntity, (project) => project.members)
  project: Relation<ProjectEntity>;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_member_user_id',
  })
  @ManyToOne(() => UserEntity, (user) => user.projectMemberships)
  user: Relation<UserEntity>;

  @Column({
    name: 'permission',
    type: 'enum',
    enum: ProjectMemberPermission,
    default: ProjectMemberPermission.READ,
  })
  permission!: ProjectMemberPermission;

  @Column({ name: 'invited_by' })
  invitedBy!: Uuid;

  @JoinColumn({
    name: 'invited_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_project_member_invited_by',
  })
  @ManyToOne(() => UserEntity)
  inviter: Relation<UserEntity>;
}
