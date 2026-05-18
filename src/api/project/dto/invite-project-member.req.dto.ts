import {
  EmailFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class InviteProjectMemberReqDto {
  @StringFieldOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @EmailFieldOptional()
  email?: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  @IsEnum(ProjectMemberPermission)
  permission!: ProjectMemberPermission;
}
