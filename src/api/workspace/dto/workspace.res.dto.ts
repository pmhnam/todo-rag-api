import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { WorkspaceEntity } from '../entities/workspace.entity';

export class WorkspaceResDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  ownerId: Uuid;

  @ApiProperty()
  @Expose()
  isOwner: boolean;

  @ApiProperty({ enum: ProjectMemberPermission })
  @Expose()
  permission: ProjectMemberPermission;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(
    entity: WorkspaceEntity,
    access?: { isOwner: boolean; permission: ProjectMemberPermission },
  ) {
    Object.assign(this, {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      ownerId: entity.ownerId,
      isOwner: access?.isOwner ?? true,
      permission: access?.permission ?? ProjectMemberPermission.WRITE_INVITE,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
