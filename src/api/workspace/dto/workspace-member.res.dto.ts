import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { WorkspaceMemberEntity } from '../entities/workspace-member.entity';

export class WorkspaceMemberResDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: Uuid;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  workspaceId: Uuid;

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

  constructor(entity: WorkspaceMemberEntity) {
    Object.assign(this, {
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId,
      userName: entity.user?.name,
      userEmail: entity.user?.email,
      permission: entity.permission,
      createdAt: entity.createdAt,
    });
  }
}
