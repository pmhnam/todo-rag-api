import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ProjectInvitationEntity } from '../entities/project-invitation.entity';
import { ProjectInvitationStatus } from '../enums/project-invitation-status.enum';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class ProjectInvitationResDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: Uuid;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  projectId: Uuid;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  @Expose()
  permission: ProjectMemberPermission;

  @ApiProperty({ enum: ProjectInvitationStatus })
  @Expose()
  status: ProjectInvitationStatus;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  invitedBy: Uuid;

  @ApiProperty()
  @Expose()
  expiresAt: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(entity: ProjectInvitationEntity) {
    Object.assign(this, {
      id: entity.id,
      projectId: entity.projectId,
      email: entity.email,
      permission: entity.permission,
      status: entity.status,
      invitedBy: entity.invitedBy,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });
  }
}
