import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { WorkspaceInvitationController } from './controllers/workspace-invitation.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceInvitationEntity } from './entities/workspace-invitation.entity';
import { WorkspaceMemberEntity } from './entities/workspace-member.entity';
import { WorkspaceEntity } from './entities/workspace.entity';
import { WorkspaceAccessService } from './services/workspace-access.service';
import { WorkspaceInvitationService } from './services/workspace-invitation.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { WorkspaceService } from './services/workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      WorkspaceMemberEntity,
      WorkspaceInvitationEntity,
      UserEntity,
    ]),
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: { events: { maxLen: 1000 } },
    }),
  ],
  controllers: [WorkspaceController, WorkspaceInvitationController],
  providers: [
    WorkspaceService,
    WorkspaceAccessService,
    WorkspaceMemberService,
    WorkspaceInvitationService,
  ],
  exports: [WorkspaceAccessService],
})
export class WorkspaceModule {}
