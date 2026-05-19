import { EmailField } from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class CreateProjectInvitationReqDto {
  @EmailField()
  @Transform(lowerCaseTransformer)
  email!: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  @IsEnum(ProjectMemberPermission)
  permission!: ProjectMemberPermission;
}
