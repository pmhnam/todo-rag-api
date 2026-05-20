import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcceptWorkspaceInvitationReqDto } from '../dto/accept-workspace-invitation.req.dto';
import { AcceptWorkspaceInvitationResDto } from '../dto/accept-workspace-invitation.res.dto';
import { WorkspaceInvitationPreviewResDto } from '../dto/workspace-invitation-preview.res.dto';
import { WorkspaceInvitationService } from '../services/workspace-invitation.service';

@ApiTags('workspace-invitations')
@Controller({ path: 'workspace-invitations', version: '1' })
export class WorkspaceInvitationController {
  constructor(
    private readonly workspaceInvitationService: WorkspaceInvitationService,
  ) {}

  @Get('preview')
  @ApiPublic({
    type: WorkspaceInvitationPreviewResDto,
    summary: 'Preview workspace invitation',
  })
  preview(@Query('token') token: string) {
    return this.workspaceInvitationService.preview(token);
  }

  @Post('accept')
  @ApiAuth({
    type: AcceptWorkspaceInvitationResDto,
    summary: 'Accept workspace invitation',
  })
  accept(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: AcceptWorkspaceInvitationReqDto,
  ) {
    return this.workspaceInvitationService.accept(userId, reqDto);
  }
}
