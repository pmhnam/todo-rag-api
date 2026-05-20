import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { EmailField } from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class CreateWorkspaceInvitationReqDto {
  @EmailField()
  @Transform(lowerCaseTransformer)
  email!: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  @IsEnum(ProjectMemberPermission)
  permission!: ProjectMemberPermission;
}
