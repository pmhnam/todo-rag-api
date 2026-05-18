import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { ProjectController } from './controllers/project.controller';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectEntity } from './entities/project.entity';
import { ProjectAccessService } from './services/project-access.service';
import { ProjectMemberService } from './services/project-member.service';
import { ProjectService } from './services/project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectMemberEntity, UserEntity]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessService, ProjectMemberService],
  exports: [ProjectService, ProjectAccessService],
})
export class ProjectModule {}
