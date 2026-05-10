import { PostEntity } from '@/api/post/entities/post.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { Uuid } from '@/common/types/common.type';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceType } from '../enums/source-type.enum';

export interface RecordContent {
  content: string;
  metadata: Record<string, any>;
}

/**
 * Helper service to resolve content from different source types.
 * Add new source types here when extending RAG to cover more entities.
 */
@Injectable()
export class IndexingHelperService {
  private readonly logger = new Logger(IndexingHelperService.name);

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  /**
   * Get the textual content and metadata from a source record.
   */
  async getRecordContent(
    sourceType: SourceType,
    sourceId: Uuid,
    userId: Uuid,
  ): Promise<RecordContent> {
    switch (sourceType) {
      case SourceType.TODO:
        return this.getTodoContent(sourceId, userId);
      case SourceType.POST:
        return this.getPostContent(sourceId, userId);
      default:
        throw new NotFoundException(
          `Source type '${sourceType}' is not supported`,
        );
    }
  }

  private async getTodoContent(
    todoId: Uuid,
    userId: Uuid,
  ): Promise<RecordContent> {
    const todo = await this.todoRepo.findOne({
      where: { id: todoId },
      relations: ['status'],
    });

    if (!todo) {
      throw new NotFoundException(`Todo ${todoId} not found`);
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('Access denied to this todo');
    }

    // Build embeddable content: combine title + description
    const contentParts = [todo.title];
    if (todo.description) {
      contentParts.push(todo.description);
    }

    return {
      content: contentParts.join('\n'),
      metadata: {
        sourceType: SourceType.TODO,
        title: todo.title,
        priority: todo.priority,
        status: todo.status?.name,
        dueDate: todo.dueDate,
      },
    };
  }

  private async getPostContent(
    postId: Uuid,
    userId: Uuid,
  ): Promise<RecordContent> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Access denied to this post');
    }

    // Build embeddable content: combine title + description + content
    const contentParts = [post.title];
    if (post.description) {
      contentParts.push(post.description);
    }
    if (post.content) {
      contentParts.push(post.content);
    }

    return {
      content: contentParts.join('\n'),
      metadata: {
        sourceType: SourceType.POST,
        title: post.title,
        slug: post.slug,
      },
    };
  }
}
