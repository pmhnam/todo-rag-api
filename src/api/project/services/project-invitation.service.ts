import { UserEntity } from '@/api/user/entities/user.entity';
import { IProjectInvitationJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import crypto from 'node:crypto';
import { Repository } from 'typeorm';
import { AcceptProjectInvitationReqDto } from '../dto/accept-project-invitation.req.dto';
import { AcceptProjectInvitationResDto } from '../dto/accept-project-invitation.res.dto';
import { CreateProjectInvitationReqDto } from '../dto/create-project-invitation.req.dto';
import { ProjectInvitationPreviewResDto } from '../dto/project-invitation-preview.res.dto';
import { ProjectInvitationResDto } from '../dto/project-invitation.res.dto';
import { ProjectMemberResDto } from '../dto/project-member.res.dto';
import { ProjectInvitationEntity } from '../entities/project-invitation.entity';
import { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectInvitationStatus } from '../enums/project-invitation-status.enum';
import { ProjectAccessService } from './project-access.service';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ProjectInvitationService {
  constructor(
    @InjectRepository(ProjectInvitationEntity)
    private readonly invitationRepository: Repository<ProjectInvitationEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly memberRepository: Repository<ProjectMemberEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IProjectInvitationJob, any, string>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(
    projectId: Uuid,
    inviterId: Uuid,
    reqDto: CreateProjectInvitationReqDto,
  ): Promise<ProjectInvitationResDto> {
    const access = await this.projectAccessService.assertCanInvite(
      projectId,
      inviterId,
    );
    const email = normalizeEmail(reqDto.email);
    const [invitee, inviter] = await Promise.all([
      this.userRepository.findOne({ where: { email } }),
      this.userRepository.findOneBy({ id: inviterId }),
    ]);

    if (invitee?.id === access.project.userId) {
      throw new BadRequestException('Project owner is already a collaborator');
    }

    if (invitee) {
      const existingMember = await this.memberRepository.findOne({
        where: { projectId, userId: invitee.id },
      });
      if (existingMember) {
        throw new ConflictException('User is already a collaborator');
      }
    }

    const { token, tokenHash } = createInvitationToken();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    let invitation = await this.invitationRepository.findOne({
      where: { projectId, email, status: ProjectInvitationStatus.PENDING },
    });

    if (invitation) {
      invitation.permission = reqDto.permission;
      invitation.tokenHash = tokenHash;
      invitation.expiresAt = expiresAt;
      invitation.updatedBy = inviterId;
    } else {
      invitation = this.invitationRepository.create({
        projectId,
        email,
        permission: reqDto.permission,
        tokenHash,
        status: ProjectInvitationStatus.PENDING,
        invitedBy: inviterId,
        expiresAt,
        createdBy: inviterId,
        updatedBy: inviterId,
      });
    }

    const saved = await this.invitationRepository.save(invitation);
    await this.sendInvitationEmail({
      email,
      token,
      inviterName: inviter?.name || inviter?.email || 'A collaborator',
      projectName: access.project.name,
      permission: reqDto.permission,
      expiresAt,
    });

    return new ProjectInvitationResDto(saved);
  }

  async findAll(
    projectId: Uuid,
    userId: Uuid,
  ): Promise<ProjectInvitationResDto[]> {
    await this.projectAccessService.assertCanInvite(projectId, userId);
    const invitations = await this.invitationRepository.find({
      where: { projectId, status: ProjectInvitationStatus.PENDING },
      order: { createdAt: 'ASC' },
    });

    return invitations.map((item) => new ProjectInvitationResDto(item));
  }

  async revoke(
    projectId: Uuid,
    invitationId: Uuid,
    userId: Uuid,
  ): Promise<void> {
    await this.projectAccessService.assertCanInvite(projectId, userId);
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, projectId },
    });
    if (!invitation) {
      throw new NotFoundException('Project invitation not found');
    }

    invitation.status = ProjectInvitationStatus.REVOKED;
    invitation.updatedBy = userId;
    await this.invitationRepository.save(invitation);
  }

  async preview(token: string): Promise<ProjectInvitationPreviewResDto> {
    const invitation = await this.findByToken(token);
    await this.expireIfNeeded(invitation);
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new GoneException('Invitation is no longer available');
    }

    const project = await this.projectRepository.findOneBy({
      id: invitation.projectId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      projectName: project.name,
      email: invitation.email,
      permission: invitation.permission,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(
    userId: Uuid,
    reqDto: AcceptProjectInvitationReqDto,
  ): Promise<AcceptProjectInvitationResDto> {
    const invitation = await this.findByToken(reqDto.token);
    await this.expireIfNeeded(invitation);
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new GoneException('Invitation is no longer available');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || normalizeEmail(user.email) !== invitation.email) {
      throw new ForbiddenException('This invite was sent to another email');
    }

    const project = await this.projectRepository.findOneBy({
      id: invitation.projectId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.userId === userId) {
      throw new BadRequestException('Project owner is already a collaborator');
    }

    let member = await this.memberRepository.findOne({
      where: { projectId: invitation.projectId, userId },
      relations: ['user'],
    });
    if (!member) {
      member = this.memberRepository.create({
        projectId: invitation.projectId,
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

    invitation.status = ProjectInvitationStatus.ACCEPTED;
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date();
    invitation.updatedBy = userId;
    await this.invitationRepository.save(invitation);

    return {
      projectId: invitation.projectId,
      member: new ProjectMemberResDto(member),
    };
  }

  private async findByToken(token: string) {
    if (!token) {
      throw new NotFoundException('Project invitation not found');
    }
    const invitation = await this.invitationRepository.findOne({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation) {
      throw new NotFoundException('Project invitation not found');
    }
    return invitation;
  }

  private async expireIfNeeded(invitation: ProjectInvitationEntity) {
    if (
      invitation.status === ProjectInvitationStatus.PENDING &&
      invitation.expiresAt.getTime() < Date.now()
    ) {
      invitation.status = ProjectInvitationStatus.EXPIRED;
      invitation.updatedBy = SYSTEM_USER_ID;
      await this.invitationRepository.save(invitation);
    }
  }

  private async sendInvitationEmail(params: {
    email: string;
    token: string;
    inviterName: string;
    projectName: string;
    permission: string;
    expiresAt: Date;
  }) {
    await this.emailQueue.add(
      JobName.PROJECT_INVITATION,
      {
        email: params.email,
        inviterName: params.inviterName,
        projectName: params.projectName,
        token: params.token,
        permission: params.permission,
        expiresAt: params.expiresAt.toLocaleDateString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );
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
