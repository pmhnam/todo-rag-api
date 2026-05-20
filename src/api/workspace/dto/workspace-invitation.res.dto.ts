import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceInvitationEntity } from '../entities/workspace-invitation.entity';
import { WorkspaceInvitationStatus } from '../enums/workspace-invitation-status.enum';

export class WorkspaceInvitationResDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ format: 'uuid' })
  workspaceId: Uuid;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  permission: ProjectMemberPermission;

  @ApiProperty({ enum: WorkspaceInvitationStatus })
  status: WorkspaceInvitationStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  constructor(entity: WorkspaceInvitationEntity) {
    Object.assign(this, {
      id: entity.id,
      workspaceId: entity.workspaceId,
      email: entity.email,
      permission: entity.permission,
      status: entity.status,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });
  }
}
