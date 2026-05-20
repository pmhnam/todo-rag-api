import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateWorkspaceMemberReqDto {
  @ApiProperty({ enum: ProjectMemberPermission })
  @IsEnum(ProjectMemberPermission)
  permission!: ProjectMemberPermission;
}
