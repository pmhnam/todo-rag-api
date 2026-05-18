import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class UpdateProjectMemberReqDto {
  @ApiProperty({ enum: ProjectMemberPermission })
  @IsEnum(ProjectMemberPermission)
  permission!: ProjectMemberPermission;
}
