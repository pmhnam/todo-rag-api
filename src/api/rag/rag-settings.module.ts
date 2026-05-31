import { ProjectEntity } from '@/api/project/entities/project.entity';
import { ProjectModule } from '@/api/project/project.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagSettingsController } from './controllers/rag-settings.controller';
import { RagSettingsService } from './services/rag-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity]), ProjectModule],
  controllers: [RagSettingsController],
  providers: [RagSettingsService],
  exports: [RagSettingsService],
})
export class RagSettingsModule {}
