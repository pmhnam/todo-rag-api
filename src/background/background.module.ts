import { Module } from '@nestjs/common';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
import { EmbeddingQueueModule } from './queues/embedding-queue/embedding-queue.module';
@Module({
  imports: [EmailQueueModule, EmbeddingQueueModule],
})
export class BackgroundModule {}
