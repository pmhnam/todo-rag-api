import {
  IEmailJob,
  IResetPasswordJob,
  IVerifyEmailJob,
} from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { Branded } from '@/common/types/types';
import { AllConfigType } from '@/config/config.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { CacheKey } from '@/constants/cache.constant';
import { ErrorCode } from '@/constants/error-code.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { createCacheKey } from '@/utils/cache.util';
import { verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import ms from 'ms';
import { Repository } from 'typeorm';
import { SessionEntity } from '../user/entities/session.entity';
import { UserEntity } from '../user/entities/user.entity';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { ResetPasswordReqDto } from './dto/reset-password.req.dto';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Sign in user
   * @param dto LoginReqDto
   * @returns LoginResDto
   */
  async signIn(dto: LoginReqDto): Promise<LoginResDto> {
    const { email, password } = dto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    if (!user || !user.password) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const token = await this.createSessionAndToken(user.id);

    return plainToInstance(LoginResDto, {
      userId: user.id,
      ...token,
    });
  }

  async register(dto: RegisterReqDto): Promise<RegisterResDto> {
    // Check if the user already exists
    const isExistUser = await UserEntity.exists({
      where: { email: dto.email },
    });

    if (isExistUser) {
      throw new ValidationException(ErrorCode.E003);
    }

    // Register user
    const user = new UserEntity({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });

    await user.save();

    await this.enqueueEmailVerification(user);

    return plainToInstance(RegisterResDto, {
      userId: user.id,
    });
  }

  async googleLogin(idToken: string): Promise<LoginResDto> {
    const clientId = this.getGoogleClientId();
    const ticket = await this.getGoogleClient().verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException();
    }

    const email = payload.email.toLowerCase();
    let user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email'],
    });

    if (!user) {
      user = new UserEntity({
        name: payload.name || email.split('@')[0],
        email,
        image: payload.picture || '',
        password: null,
        emailVerifiedAt: payload.email_verified ? new Date() : undefined,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });

      await user.save();
    }

    const token = await this.createSessionAndToken(user.id);

    return plainToInstance(LoginResDto, {
      userId: user.id,
      ...token,
    });
  }

  async verifyEmail(token: string): Promise<{ success: true }> {
    const { id } = this.verifyEmailToken(token);
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerifiedAt) {
      return { success: true };
    }

    const cachedToken = await this.cacheManager.get<string>(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, user.id),
    );
    if (cachedToken !== token) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerifiedAt = new Date();
    user.updatedBy = SYSTEM_USER_ID;
    await this.userRepository.save(user);
    await this.cacheManager.del(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, user.id),
    );

    return { success: true };
  }

  async resendVerifyEmail(email: string): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      return { success: true };
    }

    await this.enqueueEmailVerification(user);
    return { success: true };
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { success: true };
    }

    const token = await this.createForgotPasswordToken({ id: user.id });
    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });
    await this.cacheManager.set(
      createCacheKey(CacheKey.PASSWORD_RESET, user.id),
      token,
      ms(tokenExpiresIn),
    );
    await this.emailQueue.add(
      JobName.PASSWORD_RESET,
      { email: user.email, token } as IResetPasswordJob,
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );

    return { success: true };
  }

  async verifyForgotPassword(token: string): Promise<{ valid: true }> {
    const { id } = this.verifyForgotPasswordToken(token);
    const cachedToken = await this.cacheManager.get<string>(
      createCacheKey(CacheKey.PASSWORD_RESET, id),
    );
    if (cachedToken !== token) {
      throw new BadRequestException('Invalid reset token');
    }

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordReqDto): Promise<{ success: true }> {
    const { id } = this.verifyForgotPasswordToken(dto.token);
    const cachedToken = await this.cacheManager.get<string>(
      createCacheKey(CacheKey.PASSWORD_RESET, id),
    );
    if (cachedToken !== dto.token) {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });
    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    user.password = dto.password;
    user.updatedBy = SYSTEM_USER_ID;
    await this.userRepository.save(user);
    await this.cacheManager.del(createCacheKey(CacheKey.PASSWORD_RESET, id));

    return { success: true };
  }

  async changePassword(
    userToken: JwtPayloadType,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({
      where: { id: userToken.id as Uuid },
      select: ['id', 'password'],
    });

    if (!user || !(await verifyPassword(currentPassword, user.password))) {
      throw new UnauthorizedException();
    }

    user.password = newPassword;
    user.updatedBy = userToken.id;
    await this.userRepository.save(user);
    await SessionEntity.createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: userToken.id })
      .andWhere('id != :sessionId', { sessionId: userToken.sessionId })
      .execute();

    return { success: true };
  }

  async logout(userToken: JwtPayloadType): Promise<void> {
    await this.cacheManager.set<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, userToken.sessionId),
      true,
      userToken.exp * 1000 - Date.now(),
    );
    await SessionEntity.delete(userToken.sessionId);
  }

  async refreshToken(dto: RefreshReqDto): Promise<RefreshResDto> {
    const { sessionId, hash } = this.verifyRefreshToken(dto.refreshToken);
    const session = await SessionEntity.findOneBy({ id: sessionId });

    if (!session || session.hash !== hash) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findOneOrFail({
      where: { id: session.userId },
      select: ['id'],
    });

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await SessionEntity.update(session.id, { hash: newHash });

    return await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash: newHash,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException();
    }

    // Force logout if the session is in the blacklist
    const isSessionBlacklisted = await this.cacheManager.get<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, payload.sessionId),
    );

    if (isSessionBlacklisted) {
      throw new UnauthorizedException();
    }

    return payload;
  }

  private getGoogleClientId(): string {
    const clientId = this.configService.get('auth.googleClientId', {
      infer: true,
    });

    if (!clientId) {
      throw new BadRequestException('Google login is not configured');
    }

    return clientId;
  }

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(this.getGoogleClientId());
    }

    return this.googleClient;
  }

  private async createSessionAndToken(userId: string): Promise<Token> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = new SessionEntity({
      hash,
      userId,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });
    await session.save();

    return await this.createToken({
      id: userId,
      sessionId: session.id,
      hash,
    });
  }

  private verifyRefreshToken(token: string): JwtRefreshPayloadType {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  private verifyEmailToken(token: string): { id: Uuid } {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new BadRequestException('Invalid verification token');
    }
  }

  private verifyForgotPasswordToken(token: string): { id: Uuid } {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new BadRequestException('Invalid reset token');
    }
  }

  private async createVerificationToken(data: { id: string }): Promise<string> {
    return await this.jwtService.signAsync(
      {
        id: data.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );
  }

  private async createForgotPasswordToken(data: {
    id: string;
  }): Promise<string> {
    return await this.jwtService.signAsync(
      { id: data.id },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.forgotExpires', {
          infer: true,
        }),
      },
    );
  }

  private async enqueueEmailVerification(user: UserEntity): Promise<void> {
    const token = await this.createVerificationToken({ id: user.id });
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      { infer: true },
    );
    await this.cacheManager.set(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, user.id),
      token,
      ms(tokenExpiresIn),
    );
    await this.emailQueue.add(
      JobName.EMAIL_VERIFICATION,
      {
        email: user.email,
        token,
      } as IVerifyEmailJob,
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );
  }

  private async createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: '', // TODO: add role
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenExpires,
    } as Token;
  }
}
