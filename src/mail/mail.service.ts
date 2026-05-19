import { AllConfigType } from '@/config/config.type';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailerService: MailerService,
  ) {}

  async sendEmailVerification(email: string, token: string) {
    const url = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'email-verification',
      context: {
        email: email,
        url,
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const url = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Password',
      template: 'password-reset',
      context: {
        email,
        url,
      },
    });
  }

  async sendProjectInvitation(params: {
    email: string;
    inviterName: string;
    projectName: string;
    token: string;
    permission: string;
    expiresAt: string;
  }) {
    const url = `${this.getFrontendUrl()}/invite?token=${params.token}`;

    await this.mailerService.sendMail({
      to: params.email,
      subject: `Invitation to ${params.projectName}`,
      template: 'project-invitation',
      context: {
        inviterName: params.inviterName,
        projectName: params.projectName,
        permission: params.permission,
        expiresAt: params.expiresAt,
        url,
      },
    });
  }

  private getFrontendUrl() {
    return this.configService
      .getOrThrow('app.frontendUrl', { infer: true })
      .replace(/\/$/, '');
  }
}
