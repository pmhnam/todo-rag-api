import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { StorageService } from '@/storage/storage.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { PresignTodoAttachmentReqDto } from '../dto/presign-todo-attachment.req.dto';
import { PresignTodoAttachmentResDto } from '../dto/presign-todo-attachment.res.dto';
import { TodoAttachmentKind } from '../enums/todo-attachment-kind.enum';
import { GetTodoDetailUseCase } from './get-todo-detail.use-case';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function resolveAttachmentKind(mimeType: string, size: number) {
  if (IMAGE_MIME_TYPES.has(mimeType)) {
    if (size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }
    return TodoAttachmentKind.IMAGE;
  }

  if (VIDEO_MIME_TYPES.has(mimeType)) {
    if (size > MAX_VIDEO_SIZE) {
      throw new BadRequestException('Video must be 100MB or smaller');
    }
    return TodoAttachmentKind.VIDEO;
  }

  throw new BadRequestException('Unsupported attachment type');
}

@Injectable()
export class PresignTodoAttachmentUseCase {
  constructor(
    private readonly getTodoDetailUseCase: GetTodoDetailUseCase,
    private readonly projectAccessService: ProjectAccessService,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    todoId: Uuid,
    userId: Uuid,
    reqDto: PresignTodoAttachmentReqDto,
  ): Promise<PresignTodoAttachmentResDto> {
    const todo = await this.getTodoDetailUseCase.getEntity(todoId, userId);
    await this.projectAccessService.assertCanWrite(todo.projectId, userId);
    resolveAttachmentKind(reqDto.mimeType, reqDto.size);

    const extension = path.extname(reqDto.filename).toLowerCase();
    const key = `todos/${todoId}/${randomUUID()}${extension}`;
    const presigned = await this.storageService.createPresignedPutUrl(
      key,
      reqDto.mimeType,
    );

    return { key, ...presigned };
  }
}
