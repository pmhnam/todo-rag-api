import { IndexingService } from '@/api/rag/services/indexing.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { SourceType } from '../../rag/enums/source-type.enum';
import { TodoEntity } from '../entities/todo.entity';

@Injectable()
export class TodoIndexingService {
  private readonly logger = new Logger(TodoIndexingService.name);

  constructor(private readonly indexingService: IndexingService) {}

  reindexAsync(userId: Uuid, todo: TodoEntity): void {
    this.reindex(userId, todo).catch((err) =>
      this.logger.warn(`Failed to reindex todo ${todo.id}: ${err.message}`),
    );
  }

  removeIndexAsync(todoId: Uuid): void {
    this.indexingService
      .removeIndex(SourceType.TODO, todoId)
      .catch((err) =>
        this.logger.warn(
          `Failed to remove index for todo ${todoId}: ${err.message}`,
        ),
      );
  }

  private async reindex(userId: Uuid, todo: TodoEntity): Promise<void> {
    const content = [todo.title, todo.description].filter(Boolean).join('\n');

    await this.indexingService.reindexIfChanged(
      userId,
      SourceType.TODO,
      todo.id,
      content,
      {
        title: todo.title,
        priority: todo.priority,
        status: todo.status?.name,
      },
    );
  }
}
