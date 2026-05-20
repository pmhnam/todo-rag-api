import { WorkspaceMemberEntity } from '@/api/workspace/entities/workspace-member.entity';
import { WorkspaceEntity } from '@/api/workspace/entities/workspace.entity';
import { WorkspaceAccessService } from '@/api/workspace/services/workspace-access.service';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectReqDto } from '../dto/create-project.req.dto';
import { ListProjectReqDto } from '../dto/list-project.req.dto';
import { ProjectResDto } from '../dto/project.res.dto';
import { UpdateProjectReqDto } from '../dto/update-project.req.dto';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectMemberPermission } from '../enums/project-member-permission.enum';
import { ProjectAccessService } from './project-access.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async findAll(
    userId: Uuid,
    reqDto: ListProjectReqDto,
  ): Promise<OffsetPaginatedDto<ProjectResDto>> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect(
        'project.members',
        'member',
        'member.user_id = :userId',
        { userId },
      )
      .leftJoinAndSelect('project.workspace', 'workspace')
      .leftJoinAndSelect(
        'workspace.members',
        'workspaceMember',
        'workspaceMember.user_id = :userId',
        { userId },
      )
      .where(
        'project.user_id = :userId OR member.id IS NOT NULL OR workspace.owner_id = :userId OR workspaceMember.id IS NOT NULL',
        { userId },
      )
      .orderBy('project.createdAt', reqDto.order);

    if (reqDto.workspaceId) {
      queryBuilder.andWhere('project.workspace_id = :workspaceId', {
        workspaceId: reqDto.workspaceId,
      });
    }

    if (reqDto.q) {
      queryBuilder.andWhere('project.name ILIKE :q', { q: `%${reqDto.q}%` });
    }

    const [entities, metaDto] = await paginate<ProjectEntity>(
      queryBuilder,
      reqDto,
      {
        skipCount: false,
        takeAll: false,
      },
    );

    return new OffsetPaginatedDto(
      entities.map(
        (entity) =>
          new ProjectResDto(entity, {
            isOwner: this.isOwner(entity, userId),
            permission: this.getPermission(entity, userId),
          }),
      ),
      metaDto,
    );
  }

  async findOne(id: Uuid, userId: Uuid): Promise<ProjectResDto> {
    const access = await this.projectAccessService.assertCanRead(id, userId);
    return new ProjectResDto(access.project, access);
  }

  async create(
    userId: Uuid,
    reqDto: CreateProjectReqDto,
  ): Promise<ProjectResDto> {
    const workspaceId = reqDto.workspaceId
      ? (reqDto.workspaceId as Uuid)
      : (await this.ensureDefaultWorkspace(userId)).id;
    await this.workspaceAccessService.assertCanWrite(workspaceId, userId);

    const project = new ProjectEntity({
      ...reqDto,
      workspaceId,
      createdBy: userId,
      updatedBy: userId,
      userId,
    });
    const savedProject = await this.projectRepository.save(project);
    return new ProjectResDto(savedProject);
  }

  async update(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateProjectReqDto,
  ): Promise<ProjectResDto> {
    const access = await this.projectAccessService.assertCanWrite(id, userId);
    const project = access.project;
    Object.assign(project, reqDto);
    project.updatedBy = userId;
    const updatedProject = await this.projectRepository.save(project);
    return new ProjectResDto(updatedProject, access);
  }

  async delete(id: Uuid, userId: Uuid): Promise<void> {
    const access = await this.projectAccessService.assertOwner(id, userId);
    await this.projectRepository.softRemove(access.project);
  }

  private async ensureDefaultWorkspace(userId: Uuid) {
    let workspace = await this.workspaceRepository.findOne({
      where: { ownerId: userId },
      order: { createdAt: 'ASC' },
    });
    if (!workspace) {
      workspace = await this.workspaceRepository.save(
        this.workspaceRepository.create({
          name: 'My Workspace',
          ownerId: userId,
          createdBy: userId,
          updatedBy: userId,
        }),
      );
    }
    return workspace;
  }

  private getPermission(project: ProjectEntity, userId: Uuid) {
    if (project.workspace) {
      if (project.workspace.ownerId === userId) {
        return ProjectMemberPermission.WRITE_INVITE;
      }
      const workspaceMember = (
        project.workspace.members as WorkspaceMemberEntity[] | undefined
      )?.find((item) => item.userId === userId);
      if (workspaceMember) return workspaceMember.permission;
    } else if (project.userId === userId) {
      return ProjectMemberPermission.WRITE_INVITE;
    }
    const member = project.members?.find((item) => item.userId === userId);
    return member?.permission ?? ProjectMemberPermission.READ;
  }

  private isOwner(project: ProjectEntity, userId: Uuid) {
    if (project.workspace) return project.workspace.ownerId === userId;
    return project.userId === userId;
  }
}
