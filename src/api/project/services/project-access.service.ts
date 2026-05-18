import { Uuid } from '@/common/types/common.type';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectEntity } from '../entities/project.entity';
import {
  PROJECT_WRITE_PERMISSIONS,
  ProjectMemberPermission,
} from '../enums/project-member-permission.enum';

export type ProjectAccess = {
  project: ProjectEntity;
  isOwner: boolean;
  permission: ProjectMemberPermission;
};

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly projectMemberRepository: Repository<ProjectMemberEntity>,
  ) {}

  async getAccess(projectId: Uuid, userId: Uuid): Promise<ProjectAccess> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId === userId) {
      return {
        project,
        isOwner: true,
        permission: ProjectMemberPermission.WRITE_INVITE,
      };
    }

    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });
    if (!member) {
      throw new NotFoundException('Project not found');
    }

    return { project, isOwner: false, permission: member.permission };
  }

  async assertCanRead(projectId: Uuid, userId: Uuid): Promise<ProjectAccess> {
    return this.getAccess(projectId, userId);
  }

  async assertCanWrite(projectId: Uuid, userId: Uuid): Promise<ProjectAccess> {
    const access = await this.getAccess(projectId, userId);
    if (
      !access.isOwner &&
      !PROJECT_WRITE_PERMISSIONS.includes(access.permission)
    ) {
      throw new ForbiddenException('Insufficient project permission');
    }
    return access;
  }

  async assertCanInvite(projectId: Uuid, userId: Uuid): Promise<ProjectAccess> {
    const access = await this.getAccess(projectId, userId);
    if (
      !access.isOwner &&
      access.permission !== ProjectMemberPermission.WRITE_INVITE
    ) {
      throw new ForbiddenException('Insufficient project permission');
    }
    return access;
  }

  async assertOwner(projectId: Uuid, userId: Uuid): Promise<ProjectAccess> {
    const access = await this.getAccess(projectId, userId);
    if (!access.isOwner) {
      throw new ForbiddenException(
        'Only the project owner can perform this action',
      );
    }
    return access;
  }
}
