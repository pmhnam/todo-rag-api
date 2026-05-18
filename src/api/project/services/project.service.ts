import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectReqDto } from '../dto/create-project.req.dto';
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
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findAll(
    userId: Uuid,
    reqDto: PageOptionsDto,
  ): Promise<OffsetPaginatedDto<ProjectResDto>> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect(
        'project.members',
        'member',
        'member.user_id = :userId',
        { userId },
      )
      .where('project.userId = :userId OR member.id IS NOT NULL', { userId })
      .orderBy('project.createdAt', reqDto.order);

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
            isOwner: entity.userId === userId,
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
    const project = new ProjectEntity({
      ...reqDto,
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

  private getPermission(project: ProjectEntity, userId: Uuid) {
    if (project.userId === userId) {
      return ProjectMemberPermission.WRITE_INVITE;
    }
    const member = project.members?.find((item) => item.userId === userId);
    return member?.permission ?? ProjectMemberPermission.READ;
  }
}
