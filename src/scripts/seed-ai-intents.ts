import { NestFactory } from '@nestjs/core';
import { IntentSeederService } from '../api/rag/intent/intent-seeder.service';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    await app.get(IntentSeederService).seed();
  } finally {
    await app.close();
  }
}

void bootstrap();
