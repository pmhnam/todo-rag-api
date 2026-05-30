import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordReqDto } from './dto/forgot-password.req.dto';
import { GoogleLoginReqDto } from './dto/google-login.req.dto';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { ResendVerifyEmailReqDto } from './dto/resend-verify-email.req.dto';
import { ResetPasswordReqDto } from './dto/reset-password.req.dto';
import { VerifyForgotPasswordReqDto } from './dto/verify-forgot-password.req.dto';
import { JwtPayloadType } from './types/jwt-payload.type';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiPublic({
    type: LoginResDto,
    summary: 'Sign in',
  })
  @Post('email/login')
  async signIn(@Body() userLogin: LoginReqDto): Promise<LoginResDto> {
    return await this.authService.signIn(userLogin);
  }

  @ApiPublic({
    type: LoginResDto,
    summary: 'Sign in with Google',
  })
  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginReqDto): Promise<LoginResDto> {
    return await this.authService.googleLogin(dto.idToken);
  }

  @ApiPublic()
  @Post('email/register')
  async register(@Body() dto: RegisterReqDto): Promise<RegisterResDto> {
    return await this.authService.register(dto);
  }

  @ApiAuth({
    summary: 'Logout',
    errorResponses: [400, 401, 403, 500],
  })
  @Post('logout')
  async logout(@CurrentUser() userToken: JwtPayloadType): Promise<void> {
    await this.authService.logout(userToken);
  }

  @ApiPublic({
    type: RefreshResDto,
    summary: 'Refresh token',
  })
  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<RefreshResDto> {
    return await this.authService.refreshToken(dto);
  }

  @ApiPublic()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordReqDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiPublic()
  @Post('verify/forgot-password')
  async verifyForgotPassword(@Body() dto: VerifyForgotPasswordReqDto) {
    return this.authService.verifyForgotPassword(dto.token);
  }

  @ApiPublic()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordReqDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiPublic()
  @Get('verify/email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiPublic()
  @Post('verify/email/resend')
  async resendVerifyEmail(@Body() dto: ResendVerifyEmailReqDto) {
    return this.authService.resendVerifyEmail(dto.email);
  }
}
