import { PostEntity } from '@/api/post/entities/post.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexingController } from './controllers/indexing.controller';
import { RagCoreModule } from './rag-core.module';
import { IndexingHelperService } from './services/indexing-helper.service';
import { SourceResolverService } from './services/source-resolver.service';

@Module({
  imports: [TypeOrmModule.forFeature([TodoEntity, PostEntity]), RagCoreModule],
  controllers: [IndexingController],
  providers: [IndexingHelperService, SourceResolverService],
})
export class RagIndexingModule {}
