import { Module } from '@nestjs/common';
import { RagCoreModule } from './rag-core.module';
import { QueryReformulationService } from './services/query-reformulation.service';
import { RagPromptBuilderService } from './services/rag-prompt-builder.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [RagCoreModule],
  providers: [
    SearchService,
    RagPromptBuilderService,
    QueryReformulationService,
  ],
  exports: [SearchService, RagPromptBuilderService],
})
export class RagSearchModule {}
