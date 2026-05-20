import {
  PROJECT_WRITE_PERMISSIONS,
  ProjectMemberPermission,
} from '@/api/project/enums/project-member-permission.enum';
import { Uuid } from '@/common/types/common.type';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMemberEntity } from '../entities/workspace-member.entity';
import { WorkspaceEntity } from '../entities/workspace.entity';

export type WorkspaceAccess = {
  workspace: WorkspaceEntity;
  isOwner: boolean;
  permission: ProjectMemberPermission;
};

@Injectable()
export class WorkspaceAccessService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async getAccess(workspaceId: Uuid, userId: Uuid): Promise<WorkspaceAccess> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId === userId) {
      return {
        workspace,
        isOwner: true,
        permission: ProjectMemberPermission.WRITE_INVITE,
      };
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new NotFoundException('Workspace not found');
    }

    return { workspace, isOwner: false, permission: member.permission };
  }

  async assertCanRead(workspaceId: Uuid, userId: Uuid) {
    return this.getAccess(workspaceId, userId);
  }

  async assertCanWrite(workspaceId: Uuid, userId: Uuid) {
    const access = await this.getAccess(workspaceId, userId);
    if (
      !access.isOwner &&
      !PROJECT_WRITE_PERMISSIONS.includes(access.permission)
    ) {
      throw new ForbiddenException('Insufficient workspace permission');
    }
    return access;
  }

  async assertCanInvite(workspaceId: Uuid, userId: Uuid) {
    const access = await this.getAccess(workspaceId, userId);
    if (
      !access.isOwner &&
      access.permission !== ProjectMemberPermission.WRITE_INVITE
    ) {
      throw new ForbiddenException('Insufficient workspace permission');
    }
    return access;
  }

  async assertOwner(workspaceId: Uuid, userId: Uuid) {
    const access = await this.getAccess(workspaceId, userId);
    if (!access.isOwner) {
      throw new ForbiddenException(
        'Only the workspace owner can perform this action',
      );
    }
    return access;
  }
}
