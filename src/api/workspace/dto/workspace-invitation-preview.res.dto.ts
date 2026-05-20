import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceInvitationStatus } from '../enums/workspace-invitation-status.enum';

export class WorkspaceInvitationPreviewResDto {
  @ApiProperty()
  workspaceName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  permission: ProjectMemberPermission;

  @ApiProperty({ enum: WorkspaceInvitationStatus })
  status: WorkspaceInvitationStatus;

  @ApiProperty()
  expiresAt: Date;
}
