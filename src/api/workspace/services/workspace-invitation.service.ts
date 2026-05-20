import { UserEntity } from '@/api/user/entities/user.entity';
import { IWorkspaceInvitationJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import crypto from 'node:crypto';
import { Repository } from 'typeorm';
import { AcceptWorkspaceInvitationReqDto } from '../dto/accept-workspace-invitation.req.dto';
import { AcceptWorkspaceInvitationResDto } from '../dto/accept-workspace-invitation.res.dto';
import { CreateWorkspaceInvitationReqDto } from '../dto/create-workspace-invitation.req.dto';
import { WorkspaceInvitationPreviewResDto } from '../dto/workspace-invitation-preview.res.dto';
import { WorkspaceInvitationResDto } from '../dto/workspace-invitation.res.dto';
import { WorkspaceMemberResDto } from '../dto/workspace-member.res.dto';
import { WorkspaceInvitationEntity } from '../entities/workspace-invitation.entity';
import { WorkspaceMemberEntity } from '../entities/workspace-member.entity';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { WorkspaceInvitationStatus } from '../enums/workspace-invitation-status.enum';
import { WorkspaceAccessService } from './workspace-access.service';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class WorkspaceInvitationService {
  constructor(
    @InjectRepository(WorkspaceInvitationEntity)
    private readonly invitationRepository: Repository<WorkspaceInvitationEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepository: Repository<WorkspaceMemberEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IWorkspaceInvitationJob, any, string>,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(
    workspaceId: Uuid,
    inviterId: Uuid,
    reqDto: CreateWorkspaceInvitationReqDto,
  ) {
    const access = await this.workspaceAccessService.assertCanInvite(
      workspaceId,
      inviterId,
    );
    const email = normalizeEmail(reqDto.email);
    const [invitee, inviter] = await Promise.all([
      this.userRepository.findOne({ where: { email } }),
      this.userRepository.findOneBy({ id: inviterId }),
    ]);
    if (invitee?.id === access.workspace.ownerId) {
      throw new BadRequestException(
        'Workspace owner is already a collaborator',
      );
    }

    const { token, tokenHash } = createInvitationToken();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    let invitation = await this.invitationRepository.findOne({
      where: { workspaceId, email, status: WorkspaceInvitationStatus.PENDING },
    });
    if (invitation) {
      invitation.permission = reqDto.permission;
      invitation.tokenHash = tokenHash;
      invitation.expiresAt = expiresAt;
      invitation.updatedBy = inviterId;
    } else {
      invitation = this.invitationRepository.create({
        workspaceId,
        email,
        permission: reqDto.permission,
        tokenHash,
        status: WorkspaceInvitationStatus.PENDING,
        invitedBy: inviterId,
        expiresAt,
        createdBy: inviterId,
        updatedBy: inviterId,
      });
    }

    const saved = await this.invitationRepository.save(invitation);
    await this.emailQueue.add(
      JobName.WORKSPACE_INVITATION,
      {
        email,
        token,
        inviterName: inviter?.name || inviter?.email || 'A collaborator',
        workspaceName: access.workspace.name,
        permission: reqDto.permission,
        expiresAt: expiresAt.toLocaleDateString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );
    return new WorkspaceInvitationResDto(saved);
  }

  async findAll(workspaceId: Uuid, userId: Uuid) {
    await this.workspaceAccessService.assertCanInvite(workspaceId, userId);
    const invitations = await this.invitationRepository.find({
      where: { workspaceId, status: WorkspaceInvitationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    return invitations.map((item) => new WorkspaceInvitationResDto(item));
  }

  async revoke(workspaceId: Uuid, invitationId: Uuid, userId: Uuid) {
    await this.workspaceAccessService.assertCanInvite(workspaceId, userId);
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, workspaceId },
    });
    if (!invitation)
      throw new NotFoundException('Workspace invitation not found');
    invitation.status = WorkspaceInvitationStatus.REVOKED;
    invitation.updatedBy = userId;
    await this.invitationRepository.save(invitation);
  }

  async preview(token: string): Promise<WorkspaceInvitationPreviewResDto> {
    const invitation = await this.findByToken(token);
    await this.expireIfNeeded(invitation);
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new GoneException('Invitation is no longer available');
    }
    const workspace = await this.workspaceRepository.findOneBy({
      id: invitation.workspaceId,
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return {
      workspaceName: workspace.name,
      email: invitation.email,
      permission: invitation.permission,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(
    userId: Uuid,
    reqDto: AcceptWorkspaceInvitationReqDto,
  ): Promise<AcceptWorkspaceInvitationResDto> {
    const invitation = await this.findByToken(reqDto.token);
    await this.expireIfNeeded(invitation);
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new GoneException('Invitation is no longer available');
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || normalizeEmail(user.email) !== invitation.email) {
      throw new ForbiddenException('This invite was sent to another email');
    }
    const workspace = await this.workspaceRepository.findOneBy({
      id: invitation.workspaceId,
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.ownerId === userId) {
      throw new BadRequestException(
        'Workspace owner is already a collaborator',
      );
    }

    let member = await this.memberRepository.findOne({
      where: { workspaceId: invitation.workspaceId, userId },
      relations: ['user'],
    });
    if (!member) {
      member = this.memberRepository.create({
        workspaceId: invitation.workspaceId,
        userId,
        permission: invitation.permission,
        invitedBy: invitation.invitedBy,
        createdBy: userId,
        updatedBy: userId,
        user,
      });
      member = await this.memberRepository.save(member);
      member.user = user;
    }
    invitation.status = WorkspaceInvitationStatus.ACCEPTED;
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date();
    invitation.updatedBy = userId;
    await this.invitationRepository.save(invitation);

    return {
      workspaceId: invitation.workspaceId,
      member: new WorkspaceMemberResDto(member),
    };
  }

  private async findByToken(token: string) {
    if (!token) throw new NotFoundException('Workspace invitation not found');
    const invitation = await this.invitationRepository.findOne({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation)
      throw new NotFoundException('Workspace invitation not found');
    return invitation;
  }

  private async expireIfNeeded(invitation: WorkspaceInvitationEntity) {
    if (
      invitation.status === WorkspaceInvitationStatus.PENDING &&
      invitation.expiresAt.getTime() < Date.now()
    ) {
      invitation.status = WorkspaceInvitationStatus.EXPIRED;
      invitation.updatedBy = SYSTEM_USER_ID;
      await this.invitationRepository.save(invitation);
    }
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createInvitationToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
