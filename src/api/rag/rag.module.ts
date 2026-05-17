import { Module } from '@nestjs/common';
import { RagController } from './controllers/rag.controller';
import { RagAgentModule } from './rag-agent.module';
import { RagConversationModule } from './rag-conversation.module';
import { RagCoreModule } from './rag-core.module';
import { RagIndexingModule } from './rag-indexing.module';
import { RagIntentModule } from './rag-intent.module';
import { RagSearchModule } from './rag-search.module';
import { RagService } from './services/rag.service';

@Module({
  imports: [
    RagConversationModule,
    RagCoreModule,
    RagSearchModule,
    RagIntentModule,
    RagAgentModule,
    RagIndexingModule,
  ],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagCoreModule],
})
export class RagModule {}
