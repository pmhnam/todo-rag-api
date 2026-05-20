import { ProjectMemberPermission } from '@/api/project/enums/project-member-permission.enum';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { paginate } from '@/utils/offset-pagination';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceReqDto } from '../dto/create-workspace.req.dto';
import { UpdateWorkspaceReqDto } from '../dto/update-workspace.req.dto';
import { WorkspaceResDto } from '../dto/workspace.res.dto';
import { WorkspaceMemberEntity } from '../entities/workspace-member.entity';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { WorkspaceAccessService } from './workspace-access.service';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async findAll(userId: Uuid, reqDto: PageOptionsDto) {
    const queryBuilder = this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect(
        'workspace.members',
        'member',
        'member.user_id = :userId',
        { userId },
      )
      .where('workspace.owner_id = :userId OR member.id IS NOT NULL', {
        userId,
      })
      .orderBy('workspace.createdAt', reqDto.order);

    if (reqDto.q) {
      queryBuilder.andWhere('workspace.name ILIKE :q', { q: `%${reqDto.q}%` });
    }

    const [entities, metaDto] = await paginate<WorkspaceEntity>(
      queryBuilder,
      reqDto,
      { skipCount: false, takeAll: false },
    );

    return new OffsetPaginatedDto(
      entities.map(
        (entity) =>
          new WorkspaceResDto(entity, {
            isOwner: entity.ownerId === userId,
            permission: this.getPermission(entity, userId),
          }),
      ),
      metaDto,
    );
  }

  async findOne(id: Uuid, userId: Uuid) {
    const access = await this.workspaceAccessService.assertCanRead(id, userId);
    return new WorkspaceResDto(access.workspace, access);
  }

  async create(userId: Uuid, reqDto: CreateWorkspaceReqDto) {
    const workspace = this.workspaceRepository.create({
      ...reqDto,
      ownerId: userId,
      createdBy: userId,
      updatedBy: userId,
    });
    return new WorkspaceResDto(await this.workspaceRepository.save(workspace));
  }

  async update(id: Uuid, userId: Uuid, reqDto: UpdateWorkspaceReqDto) {
    const access = await this.workspaceAccessService.assertOwner(id, userId);
    Object.assign(access.workspace, reqDto);
    access.workspace.updatedBy = userId;
    return new WorkspaceResDto(
      await this.workspaceRepository.save(access.workspace),
      access,
    );
  }

  async delete(id: Uuid, userId: Uuid) {
    const access = await this.workspaceAccessService.assertOwner(id, userId);
    await this.workspaceRepository.softRemove(access.workspace);
  }

  private getPermission(entity: WorkspaceEntity, userId: Uuid) {
    if (entity.ownerId === userId) return ProjectMemberPermission.WRITE_INVITE;
    const member = (
      entity.members as WorkspaceMemberEntity[] | undefined
    )?.find((item) => item.userId === userId);
    return member?.permission ?? ProjectMemberPermission.READ;
  }
}
