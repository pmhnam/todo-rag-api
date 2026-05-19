import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcceptProjectInvitationReqDto } from '../dto/accept-project-invitation.req.dto';
import { AcceptProjectInvitationResDto } from '../dto/accept-project-invitation.res.dto';
import { ProjectInvitationPreviewResDto } from '../dto/project-invitation-preview.res.dto';
import { ProjectInvitationService } from '../services/project-invitation.service';

@ApiTags('project-invitations')
@Controller({ path: 'project-invitations', version: '1' })
export class ProjectInvitationController {
  constructor(
    private readonly projectInvitationService: ProjectInvitationService,
  ) {}

  @Get('preview')
  @ApiPublic({
    type: ProjectInvitationPreviewResDto,
    summary: 'Preview project invitation',
  })
  preview(
    @Query('token') token: string,
  ): Promise<ProjectInvitationPreviewResDto> {
    return this.projectInvitationService.preview(token);
  }

  @Post('accept')
  @ApiAuth({
    type: AcceptProjectInvitationResDto,
    summary: 'Accept project invitation',
  })
  accept(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: AcceptProjectInvitationReqDto,
  ): Promise<AcceptProjectInvitationResDto> {
    return this.projectInvitationService.accept(userId, reqDto);
  }
}
