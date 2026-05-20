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
import { WorkspaceMemberEntity } from './workspace-member.entity';

@Entity('workspace')
export class WorkspaceEntity extends AbstractEntity {
  constructor(data?: Partial<WorkspaceEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workspace_id',
  })
  id!: Uuid;

  @Column({ name: 'name', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'owner_id' })
  ownerId!: Uuid;

  @JoinColumn({
    name: 'owner_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_workspace_owner_id',
  })
  @ManyToOne(() => UserEntity)
  owner: Relation<UserEntity>;

  @Column({ name: 'settings', type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @OneToMany(() => WorkspaceMemberEntity, (member) => member.workspace)
  members: Relation<WorkspaceMemberEntity[]>;

  @OneToMany(() => ProjectEntity, (project) => project.workspace)
  projects: Relation<ProjectEntity[]>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
