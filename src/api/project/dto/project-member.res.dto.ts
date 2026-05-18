import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';

export class ProjectMemberResDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: Uuid;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  projectId: Uuid;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  userId: Uuid;

  @ApiProperty()
  @Expose()
  userName?: string;

  @ApiProperty()
  @Expose()
  userEmail?: string;

  @ApiProperty({ enum: ProjectMemberPermission })
  @Expose()
  permission: ProjectMemberPermission;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(entity: ProjectMemberEntity) {
    Object.assign(this, {
      id: entity.id,
      projectId: entity.projectId,
      userId: entity.userId,
      userName: entity.user?.name,
      userEmail: entity.user?.email,
      permission: entity.permission,
      createdAt: entity.createdAt,
    });
  }
}
