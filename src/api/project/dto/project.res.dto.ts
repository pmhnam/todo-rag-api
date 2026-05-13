import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ProjectEntity } from '../entities/project.entity';

export class ProjectResDto {
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
  userId: Uuid;

  @ApiProperty({ required: false })
  @Expose()
  settings?: Record<string, any>;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(entity: ProjectEntity) {
    Object.assign(this, {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      userId: entity.userId,
      settings: entity.settings,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
