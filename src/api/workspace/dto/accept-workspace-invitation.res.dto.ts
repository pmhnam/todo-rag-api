import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceMemberResDto } from './workspace-member.res.dto';

export class AcceptWorkspaceInvitationResDto {
  @ApiProperty({ format: 'uuid' })
  workspaceId: Uuid;

  @ApiProperty({ type: WorkspaceMemberResDto })
  member: WorkspaceMemberResDto;
}
