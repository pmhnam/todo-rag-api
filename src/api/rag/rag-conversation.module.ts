import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagConversationEntity } from './entities/rag-conversation.entity';
import { RagMessageEntity } from './entities/rag-message.entity';
import { RagConversationRepository } from './repositories/rag-conversation.repository';
import { RagMessageRepository } from './repositories/rag-message.repository';
import { RagConversationService } from './services/rag-conversation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RagConversationEntity, RagMessageEntity]),
  ],
  providers: [
    RagConversationService,
    RagConversationRepository,
    RagMessageRepository,
  ],
  exports: [RagConversationService],
})
export class RagConversationModule {}
