import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { ErrorCode } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { StorageService } from '@/storage/storage.service';
import { buildPaginator } from '@/utils/cursor-pagination';
import { paginate } from '@/utils/offset-pagination';
import { verifyPassword } from '@/utils/password.util';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import assert from 'assert';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Repository } from 'typeorm';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { ChangePasswordReqDto } from './dto/change-password.req.dto';
import { CompleteAvatarReqDto } from './dto/complete-avatar.req.dto';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { ListUserReqDto } from './dto/list-user.req.dto';
import { LoadMoreUsersReqDto } from './dto/load-more-users.req.dto';
import { PresignAvatarReqDto } from './dto/presign-avatar.req.dto';
import { PresignAvatarResDto } from './dto/presign-avatar.res.dto';
import { UpdateMeReqDto } from './dto/update-me.req.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';
import { UserResDto } from './dto/user.res.dto';
import { SessionEntity } from './entities/session.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateUserReqDto): Promise<UserResDto> {
    const { name, username, email, password, bio, image } = dto;

    // check uniqueness of username/email
    const user = await this.userRepository.findOne({
      where: [
        {
          username,
        },
        {
          email,
        },
      ],
    });

    if (user) {
      throw new ValidationException(ErrorCode.E001);
    }

    const newUser = new UserEntity({
      name,
      username,
      email,
      password,
      bio,
      image,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.debug(savedUser);

    return plainToInstance(UserResDto, savedUser);
  }

  async findAll(
    reqDto: ListUserReqDto,
  ): Promise<OffsetPaginatedDto<UserResDto>> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');
    const [users, metaDto] = await paginate<UserEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
    return new OffsetPaginatedDto(plainToInstance(UserResDto, users), metaDto);
  }

  async loadMoreUsers(
    reqDto: LoadMoreUsersReqDto,
  ): Promise<CursorPaginatedDto<UserResDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const paginator = buildPaginator({
      entity: UserEntity,
      alias: 'user',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: 'DESC',
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });

    const { data, cursor } = await paginator.paginate(queryBuilder);

    const metaDto = new CursorPaginationDto(
      data.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(plainToInstance(UserResDto, data), metaDto);
  }

  async findOne(id: Uuid): Promise<UserResDto> {
    assert(id, 'id is required');
    const user = await this.userRepository.findOneByOrFail({ id });

    return user.toDto(UserResDto);
  }

  async update(id: Uuid, updateUserDto: UpdateUserReqDto) {
    const user = await this.userRepository.findOneByOrFail({ id });

    user.bio = updateUserDto.bio;
    user.image = updateUserDto.image;
    user.name = updateUserDto.name;
    user.updatedBy = SYSTEM_USER_ID;

    await this.userRepository.save(user);
  }

  async updateMe(userId: Uuid, reqDto: UpdateMeReqDto): Promise<UserResDto> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    user.name = reqDto.name;
    user.bio = reqDto.bio || '';
    user.updatedBy = userId;

    return plainToInstance(UserResDto, await this.userRepository.save(user));
  }

  async presignAvatar(
    userId: Uuid,
    reqDto: PresignAvatarReqDto,
  ): Promise<PresignAvatarResDto> {
    validateAvatar(reqDto.mimeType, reqDto.size);

    const extension = path.extname(reqDto.filename).toLowerCase();
    const key = `users/${userId}/avatar/${randomUUID()}${extension}`;
    const presigned = await this.storageService.createPresignedPutUrl(
      key,
      reqDto.mimeType,
    );

    return { key, ...presigned };
  }

  async completeAvatar(
    userId: Uuid,
    reqDto: CompleteAvatarReqDto,
  ): Promise<UserResDto> {
    validateAvatar(reqDto.mimeType, reqDto.size);
    if (!reqDto.key.startsWith(`users/${userId}/avatar/`)) {
      throw new BadRequestException('Invalid avatar key');
    }

    const user = await this.userRepository.findOneByOrFail({ id: userId });
    user.image = reqDto.url;
    user.updatedBy = userId;

    return plainToInstance(UserResDto, await this.userRepository.save(user));
  }

  async changePassword(
    userToken: JwtPayloadType,
    reqDto: ChangePasswordReqDto,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({
      where: { id: userToken.id as Uuid },
      select: ['id', 'password'],
    });
    if (
      !user ||
      !(await verifyPassword(reqDto.currentPassword, user.password))
    ) {
      throw new UnauthorizedException();
    }

    user.password = reqDto.newPassword;
    user.updatedBy = userToken.id;
    await this.userRepository.save(user);
    await SessionEntity.createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: userToken.id })
      .andWhere('id != :sessionId', { sessionId: userToken.sessionId })
      .execute();

    return { success: true };
  }

  async remove(id: Uuid) {
    await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.softDelete(id);
  }
}

const AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function validateAvatar(mimeType: string, size: number) {
  if (!AVATAR_MIME_TYPES.has(mimeType)) {
    throw new BadRequestException('Unsupported avatar type');
  }
  if (size > MAX_AVATAR_SIZE) {
    throw new BadRequestException('Avatar must be 5MB or smaller');
  }
}
