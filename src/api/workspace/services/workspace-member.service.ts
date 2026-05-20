import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferWorkspaceOwnerReqDto } from '../dto/transfer-workspace-owner.req.dto';
import { UpdateWorkspaceMemberReqDto } from '../dto/update-workspace-member.req.dto';
import { WorkspaceMemberResDto } from '../dto/workspace-member.res.dto';
import { WorkspaceMemberEntity } from '../entities/workspace-member.entity';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { WorkspaceAccessService } from './workspace-access.service';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async findAll(workspaceId: Uuid, userId: Uuid) {
    await this.workspaceAccessService.assertCanRead(workspaceId, userId);
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner'],
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    const members = await this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return [
      {
        id: workspace.ownerId,
        workspaceId,
        userId: workspace.ownerId,
        userName: workspace.owner?.name,
        userEmail: workspace.owner?.email,
        permission: ProjectMemberPermission.WRITE_INVITE,
        createdAt: workspace.createdAt,
      },
      ...members.map((member) => new WorkspaceMemberResDto(member)),
    ];
  }

  async update(
    workspaceId: Uuid,
    memberId: Uuid,
    userId: Uuid,
    reqDto: UpdateWorkspaceMemberReqDto,
  ) {
    await this.workspaceAccessService.assertCanInvite(workspaceId, userId);
    const member = await this.workspaceMemberRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: ['user'],
    });
    if (!member) throw new NotFoundException('Workspace member not found');
    member.permission = reqDto.permission;
    member.updatedBy = userId;
    return new WorkspaceMemberResDto(
      await this.workspaceMemberRepository.save(member),
    );
  }

  async remove(workspaceId: Uuid, memberId: Uuid, userId: Uuid) {
    await this.workspaceAccessService.assertCanInvite(workspaceId, userId);
    const member = await this.workspaceMemberRepository.findOne({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Workspace member not found');
    await this.workspaceMemberRepository.delete(member.id);
  }

  async transferOwner(
    workspaceId: Uuid,
    userId: Uuid,
    reqDto: TransferWorkspaceOwnerReqDto,
  ) {
    const access = await this.workspaceAccessService.assertOwner(
      workspaceId,
      userId,
    );
    const nextOwner = await this.userRepository.findOneBy({
      id: reqDto.userId as Uuid,
    });
    if (!nextOwner) throw new NotFoundException('User not found');
    if (nextOwner.id === userId) {
      throw new BadRequestException('User is already the workspace owner');
    }

    let oldOwnerMember = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (!oldOwnerMember) {
      oldOwnerMember = this.workspaceMemberRepository.create({
        workspaceId,
        userId,
        permission: access.permission,
        invitedBy: userId,
        createdBy: userId,
        updatedBy: userId,
      });
    }
    oldOwnerMember.updatedBy = userId;

    const nextOwnerMember = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: nextOwner.id },
    });
    if (nextOwnerMember) {
      await this.workspaceMemberRepository.delete(nextOwnerMember.id);
    }

    access.workspace.ownerId = nextOwner.id;
    access.workspace.updatedBy = userId;
    await Promise.all([
      this.workspaceRepository.save(access.workspace),
      this.workspaceMemberRepository.save(oldOwnerMember),
    ]);
  }
}
