import { ApiProperty } from '@nestjs/swagger';
import { ProjectInvitationStatus } from '../enums/project-invitation-status.enum';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class ProjectInvitationPreviewResDto {
  @ApiProperty()
  projectName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  permission: ProjectMemberPermission;

  @ApiProperty({ enum: ProjectInvitationStatus })
  status: ProjectInvitationStatus;

  @ApiProperty()
  expiresAt: Date;
}
