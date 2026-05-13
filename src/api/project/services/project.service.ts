import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectReqDto } from '../dto/create-project.req.dto';
import { ProjectResDto } from '../dto/project.res.dto';
import { UpdateProjectReqDto } from '../dto/update-project.req.dto';
import { ProjectEntity } from '../entities/project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async findAll(
    userId: Uuid,
    reqDto: PageOptionsDto,
  ): Promise<OffsetPaginatedDto<ProjectResDto>> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .where('project.userId = :userId', { userId })
      .orderBy('project.createdAt', reqDto.order);

    const [entities, metaDto] = await paginate<ProjectEntity>(
      queryBuilder,
      reqDto,
      {
        skipCount: false,
        takeAll: false,
      },
    );

    return new OffsetPaginatedDto(
      entities.map((entity) => new ProjectResDto(entity)),
      metaDto,
    );
  }

  async findOne(id: Uuid, userId: Uuid): Promise<ProjectResDto> {
    const project = await this.projectRepository.findOne({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return new ProjectResDto(project);
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
    const project = await this.projectRepository.findOne({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    Object.assign(project, reqDto);
    const updatedProject = await this.projectRepository.save(project);
    return new ProjectResDto(updatedProject);
  }

  async delete(id: Uuid, userId: Uuid): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.softRemove(project);
  }
}
