import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateRagSettingsReqDto } from '../dto/rag-settings.req.dto';
import { RagSettingsResDto } from '../dto/rag-settings.res.dto';
import { RagSettingsService } from '../services/rag-settings.service';

@ApiTags('rag/settings')
@Controller({
  path: 'rag/settings',
  version: '1',
})
export class RagSettingsController {
  constructor(private readonly ragSettingsService: RagSettingsService) {}

  @Get('projects/:projectId')
  @ApiAuth({
    type: RagSettingsResDto,
    summary: 'Get RAG settings for a project',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async getProjectSettings(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
  ): Promise<RagSettingsResDto> {
    const settings = await this.ragSettingsService.getProjectSettings(
      projectId,
      userId,
    );

    return {
      projectId,
      ...settings,
    };
  }

  @Put('projects/:projectId')
  @ApiAuth({
    type: RagSettingsResDto,
    summary: 'Update RAG settings for a project',
  })
  @ApiParam({ name: 'projectId', type: 'String' })
  async updateProjectSettings(
    @CurrentUser('id') userId: Uuid,
    @Param('projectId', ParseUUIDPipe) projectId: Uuid,
    @Body() reqDto: UpdateRagSettingsReqDto,
  ): Promise<RagSettingsResDto> {
    const settings = await this.ragSettingsService.updateProjectSettings(
      projectId,
      userId,
      reqDto,
    );

    return {
      projectId,
      ...settings,
    };
  }
}
