import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateProjectReqDto } from '../dto/create-project.req.dto';
import { ProjectResDto } from '../dto/project.res.dto';
import { UpdateProjectReqDto } from '../dto/update-project.req.dto';
import { ProjectService } from '../services/project.service';

@ApiTags('projects')
@Controller({
  path: 'projects',
  version: '1',
})
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiAuth({
    type: ProjectResDto,
    summary: 'Get all user projects',
    isPaginated: true,
  })
  async findAll(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: PageOptionsDto,
  ): Promise<OffsetPaginatedDto<ProjectResDto>> {
    return this.projectService.findAll(userId, reqDto);
  }

  @Get(':id')
  @ApiAuth({
    type: ProjectResDto,
    summary: 'Get project by ID',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async findOne(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<ProjectResDto> {
    return this.projectService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: ProjectResDto,
    summary: 'Create a new project',
    statusCode: HttpStatus.CREATED,
  })
  async create(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: CreateProjectReqDto,
  ): Promise<ProjectResDto> {
    return this.projectService.create(userId, reqDto);
  }

  @Patch(':id')
  @ApiAuth({
    type: ProjectResDto,
    summary: 'Update a project',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async update(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateProjectReqDto,
  ): Promise<ProjectResDto> {
    return this.projectService.update(id, userId, reqDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete a project',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async delete(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<void> {
    return this.projectService.delete(id, userId);
  }
}
