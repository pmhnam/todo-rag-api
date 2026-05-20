import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
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
import { CreateWorkspaceInvitationReqDto } from '../dto/create-workspace-invitation.req.dto';
import { CreateWorkspaceReqDto } from '../dto/create-workspace.req.dto';
import { TransferWorkspaceOwnerReqDto } from '../dto/transfer-workspace-owner.req.dto';
import { UpdateWorkspaceMemberReqDto } from '../dto/update-workspace-member.req.dto';
import { UpdateWorkspaceReqDto } from '../dto/update-workspace.req.dto';
import { WorkspaceInvitationResDto } from '../dto/workspace-invitation.res.dto';
import { WorkspaceMemberResDto } from '../dto/workspace-member.res.dto';
import { WorkspaceResDto } from '../dto/workspace.res.dto';
import { WorkspaceInvitationService } from '../services/workspace-invitation.service';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { WorkspaceService } from '../services/workspace.service';

@ApiTags('workspaces')
@Controller({ path: 'workspaces', version: '1' })
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMemberService: WorkspaceMemberService,
    private readonly workspaceInvitationService: WorkspaceInvitationService,
  ) {}

  @Get()
  @ApiAuth({ type: WorkspaceResDto, summary: 'List user workspaces' })
  findAll(@CurrentUser('id') userId: Uuid, @Query() reqDto: PageOptionsDto) {
    return this.workspaceService.findAll(userId, reqDto);
  }

  @Get(':id')
  @ApiAuth({ type: WorkspaceResDto, summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', type: 'String' })
  findOne(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ) {
    return this.workspaceService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({ type: WorkspaceResDto, summary: 'Create workspace' })
  create(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: CreateWorkspaceReqDto,
  ) {
    return this.workspaceService.create(userId, reqDto);
  }

  @Patch(':id')
  @ApiAuth({ type: WorkspaceResDto, summary: 'Update workspace' })
  update(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateWorkspaceReqDto,
  ) {
    return this.workspaceService.update(id, userId, reqDto);
  }

  @Delete(':id')
  @ApiAuth({ summary: 'Delete workspace' })
  delete(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ) {
    return this.workspaceService.delete(id, userId);
  }

  @Get(':id/members')
  @ApiAuth({ type: WorkspaceMemberResDto, summary: 'List workspace members' })
  findMembers(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ) {
    return this.workspaceMemberService.findAll(id, userId);
  }

  @Patch(':id/members/:memberId')
  @ApiAuth({ type: WorkspaceMemberResDto, summary: 'Update workspace member' })
  updateMember(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('memberId', ParseUUIDPipe) memberId: Uuid,
    @Body() reqDto: UpdateWorkspaceMemberReqDto,
  ) {
    return this.workspaceMemberService.update(id, memberId, userId, reqDto);
  }

  @Delete(':id/members/:memberId')
  @ApiAuth({ summary: 'Remove workspace member' })
  removeMember(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('memberId', ParseUUIDPipe) memberId: Uuid,
  ) {
    return this.workspaceMemberService.remove(id, memberId, userId);
  }

  @Post(':id/transfer-owner')
  @ApiAuth({ summary: 'Transfer workspace ownership' })
  transferOwner(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: TransferWorkspaceOwnerReqDto,
  ) {
    return this.workspaceMemberService.transferOwner(id, userId, reqDto);
  }

  @Get(':id/invitations')
  @ApiAuth({
    type: WorkspaceInvitationResDto,
    summary: 'List pending workspace invitations',
  })
  findInvitations(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
  ) {
    return this.workspaceInvitationService.findAll(id, userId);
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: WorkspaceInvitationResDto,
    summary: 'Invite workspace collaborator',
  })
  createInvitation(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: CreateWorkspaceInvitationReqDto,
  ) {
    return this.workspaceInvitationService.create(id, userId, reqDto);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiAuth({ summary: 'Revoke pending workspace invitation' })
  revokeInvitation(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Param('invitationId', ParseUUIDPipe) invitationId: Uuid,
  ) {
    return this.workspaceInvitationService.revoke(id, invitationId, userId);
  }
}
