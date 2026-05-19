import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberResDto } from './project-member.res.dto';

export class AcceptProjectInvitationResDto {
  @ApiProperty({ format: 'uuid' })
  projectId: Uuid;

  @ApiProperty({ type: ProjectMemberResDto })
  member: ProjectMemberResDto;
}
