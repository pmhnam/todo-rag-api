import { ProjectEntity } from '@/api/project/entities/project.entity';
import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateRagSettingsReqDto } from '../dto/rag-settings.req.dto';
import { RagProjectSettings } from '../types/rag-settings.type';

const DEFAULT_RAG_SETTINGS: RagProjectSettings = {
  topK: 5,
  enableQueryRewrite: false,
  filterByProject: false,
};

@Injectable()
export class RagSettingsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async getProjectSettings(
    projectId: Uuid,
    userId: Uuid,
  ): Promise<RagProjectSettings> {
    const access = await this.projectAccessService.assertCanRead(
      projectId,
      userId,
    );
    return this.normalize(access.project.settings?.rag);
  }

  async updateProjectSettings(
    projectId: Uuid,
    userId: Uuid,
    reqDto: UpdateRagSettingsReqDto,
  ): Promise<RagProjectSettings> {
    const access = await this.projectAccessService.assertCanWrite(
      projectId,
      userId,
    );

    const project = access.project;
    const current = this.normalize(project.settings?.rag);
    const updates = this.pickDefined(reqDto);
    const next = { ...current, ...updates };

    project.settings = {
      ...(project.settings ?? {}),
      rag: next,
    };
    project.updatedBy = userId;
    await this.projectRepository.save(project);

    return next;
  }

  private normalize(
    input?: Partial<RagProjectSettings> | null,
  ): RagProjectSettings {
    if (!input) return { ...DEFAULT_RAG_SETTINGS };
    return {
      ...DEFAULT_RAG_SETTINGS,
      ...input,
    };
  }

  private pickDefined(
    reqDto: UpdateRagSettingsReqDto,
  ): Partial<RagProjectSettings> {
    const updates: Partial<RagProjectSettings> = {};

    if (reqDto.topK !== undefined) updates.topK = reqDto.topK;
    if (reqDto.maxDistance !== undefined) {
      updates.maxDistance = reqDto.maxDistance;
    }
    if (reqDto.enableQueryRewrite !== undefined) {
      updates.enableQueryRewrite = reqDto.enableQueryRewrite;
    }
    if (reqDto.filterByProject !== undefined) {
      updates.filterByProject = reqDto.filterByProject;
    }

    return updates;
  }
}
