import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteProjectMemberReqDto } from '../dto/invite-project-member.req.dto';
import { ProjectMemberResDto } from '../dto/project-member.res.dto';
import { UpdateProjectMemberReqDto } from '../dto/update-project-member.req.dto';
import { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectAccessService } from './project-access.service';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMemberEntity)
    private readonly projectMemberRepository: Repository<ProjectMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findAll(projectId: Uuid, userId: Uuid): Promise<ProjectMemberResDto[]> {
    await this.projectAccessService.assertCanRead(projectId, userId);
    const members = await this.projectMemberRepository.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return members.map((member) => new ProjectMemberResDto(member));
  }

  async invite(
    projectId: Uuid,
    inviterId: Uuid,
    reqDto: InviteProjectMemberReqDto,
  ): Promise<ProjectMemberResDto> {
    const access = await this.projectAccessService.assertCanInvite(
      projectId,
      inviterId,
    );
    const invitee = await this.resolveInvitee(reqDto);
    if (invitee.id === access.project.userId) {
      throw new BadRequestException('Project owner is already a collaborator');
    }

    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId: invitee.id },
      relations: ['user'],
    });
    if (member) {
      member.permission = reqDto.permission;
      member.updatedBy = inviterId;
      const saved = await this.projectMemberRepository.save(member);
      saved.user = invitee;
      return new ProjectMemberResDto(saved);
    }

    const newMember = this.projectMemberRepository.create({
      projectId,
      userId: invitee.id,
      permission: reqDto.permission,
      invitedBy: inviterId,
      createdBy: inviterId,
      updatedBy: inviterId,
      user: invitee,
    });
    const saved = await this.projectMemberRepository.save(newMember);
    saved.user = invitee;
    return new ProjectMemberResDto(saved);
  }

  async update(
    projectId: Uuid,
    memberId: Uuid,
    userId: Uuid,
    reqDto: UpdateProjectMemberReqDto,
  ): Promise<ProjectMemberResDto> {
    await this.projectAccessService.assertCanInvite(projectId, userId);
    const member = await this.projectMemberRepository.findOne({
      where: { id: memberId, projectId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    member.permission = reqDto.permission;
    member.updatedBy = userId;
    return new ProjectMemberResDto(
      await this.projectMemberRepository.save(member),
    );
  }

  async remove(projectId: Uuid, memberId: Uuid, userId: Uuid): Promise<void> {
    await this.projectAccessService.assertCanInvite(projectId, userId);
    const member = await this.projectMemberRepository.findOne({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException('Project member not found');
    }
    await this.projectMemberRepository.delete(member.id);
  }

  private async resolveInvitee(reqDto: InviteProjectMemberReqDto) {
    if (!reqDto.userId && !reqDto.email) {
      throw new BadRequestException('userId or email is required');
    }

    const user = await this.userRepository.findOne({
      where: reqDto.userId
        ? { id: reqDto.userId as Uuid }
        : { email: reqDto.email },
    });
    if (!user) {
      throw new ValidationException(ErrorCode.E002);
    }
    return user;
  }
}
