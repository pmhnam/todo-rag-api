import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { ProjectInvitationController } from './controllers/project-invitation.controller';
import { ProjectController } from './controllers/project.controller';
import { ProjectInvitationEntity } from './entities/project-invitation.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectEntity } from './entities/project.entity';
import { ProjectAccessService } from './services/project-access.service';
import { ProjectInvitationService } from './services/project-invitation.service';
import { ProjectMemberService } from './services/project-member.service';
import { ProjectService } from './services/project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectMemberEntity,
      ProjectInvitationEntity,
      UserEntity,
    ]),
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  controllers: [ProjectController, ProjectInvitationController],
  providers: [
    ProjectService,
    ProjectAccessService,
    ProjectMemberService,
    ProjectInvitationService,
  ],
  exports: [ProjectService, ProjectAccessService],
})
export class ProjectModule {}
