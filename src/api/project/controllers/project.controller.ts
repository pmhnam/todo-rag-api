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
import { CreateProjectInvitationReqDto } from '../dto/create-project-invitation.req.dto';
import { CreateProjectReqDto } from '../dto/create-project.req.dto';
import { InviteProjectMemberReqDto } from '../dto/invite-project-member.req.dto';
import { ProjectInvitationResDto } from '../dto/project-invitation.res.dto';
import { ProjectMemberResDto } from '../dto/project-member.res.dto';
import { ProjectResDto } from '../dto/project.res.dto';
import { UpdateProjectMemberReqDto } from '../dto/update-project-member.req.dto';
import { UpdateProjectReqDto } from '../dto/update-project.req.dto';
import { ProjectInvitationService } from '../services/project-invitation.service';
import { ProjectMemberService } from '../services/project-member.service';
import { ProjectService } from '../services/project.service';

@ApiTags('projects')
@Controller({
  path: 'projects',
  version: '1',
})
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly projectInvitationService: ProjectInvitationService,
  ) {}

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

  @Get(':id/members')
  @ApiAuth({ type: ProjectMemberResDto, summary: 'List project members' })
  @ApiParam({ name: 'id', type: 'String' })
  async findMembers(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<ProjectMemberResDto[]> {
    return this.projectMemberService.findAll(id, userId);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: ProjectMemberResDto,
    summary: 'Invite a user to collaborate on a project',
    statusCode: HttpStatus.CREATED,
  })
  @ApiParam({ name: 'id', type: 'String' })
  async inviteMember(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: InviteProjectMemberReqDto,
  ): Promise<ProjectMemberResDto> {
    return this.projectMemberService.invite(id, userId, reqDto);
  }

  @Get(':id/invitations')
  @ApiAuth({
    type: ProjectInvitationResDto,
    summary: 'List pending project invitations',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async findInvitations(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<ProjectInvitationResDto[]> {
    return this.projectInvitationService.findAll(id, userId);
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: ProjectInvitationResDto,
    summary: 'Invite a collaborator by email',
    statusCode: HttpStatus.CREATED,
  })
  @ApiParam({ name: 'id', type: 'String' })
  async createInvitation(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: CreateProjectInvitationReqDto,
  ): Promise<ProjectInvitationResDto> {
    return this.projectInvitationService.create(id, userId, reqDto);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiAuth({ summary: 'Revoke a pending project invitation' })
  @ApiParam({ name: 'id', type: 'String' })
  @ApiParam({ name: 'invitationId', type: 'String' })
  async revokeInvitation(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('invitationId', ParseUUIDPipe) invitationId: Uuid,
  ): Promise<void> {
    return this.projectInvitationService.revoke(id, invitationId, userId);
  }

  @Patch(':id/members/:memberId')
  @ApiAuth({ type: ProjectMemberResDto, summary: 'Update project member' })
  @ApiParam({ name: 'id', type: 'String' })
  @ApiParam({ name: 'memberId', type: 'String' })
  async updateMember(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('memberId', ParseUUIDPipe) memberId: Uuid,
    @Body() reqDto: UpdateProjectMemberReqDto,
  ): Promise<ProjectMemberResDto> {
    return this.projectMemberService.update(id, memberId, userId, reqDto);
  }

  @Delete(':id/members/:memberId')
  @ApiAuth({ summary: 'Remove project member' })
  @ApiParam({ name: 'id', type: 'String' })
  @ApiParam({ name: 'memberId', type: 'String' })
  async removeMember(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('memberId', ParseUUIDPipe) memberId: Uuid,
  ): Promise<void> {
    return this.projectMemberService.remove(id, memberId, userId);
  }
}
