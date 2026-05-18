import { ProjectAccessService } from '@/api/project/services/project-access.service';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TodoStatusResDto } from '../dto/todo-status.res.dto';
import { UpdateTodoStatusReqDto } from '../dto/update-todo-status.req.dto';
import { TodoStatusRepository } from '../repositories/todo-status.repository';

@Injectable()
export class UpdateTodoStatusUseCase {
  constructor(
    private readonly todoStatusRepository: TodoStatusRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async execute(
    id: Uuid,
    userId: Uuid,
    reqDto: UpdateTodoStatusReqDto,
  ): Promise<TodoStatusResDto> {
    const status = await this.todoStatusRepository.findOwnedById(id, userId);

    if (!status) {
      throw new NotFoundException({ errorCode: ErrorCode.E100 });
    }
    await this.projectAccessService.assertCanWrite(status.projectId, userId);

    Object.assign(status, reqDto);
    status.updatedBy = userId;

    return plainToInstance(
      TodoStatusResDto,
      await this.todoStatusRepository.save(status),
    );
  }
}
