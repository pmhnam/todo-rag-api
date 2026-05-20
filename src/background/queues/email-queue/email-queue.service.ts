import {
  IProjectInvitationJob,
  IResetPasswordJob,
  IVerifyEmailJob,
  IWorkspaceInvitationJob,
} from '@/common/interfaces/job.interface';
import { MailService } from '@/mail/mail.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(private readonly mailService: MailService) {}

  async sendEmailVerification(data: IVerifyEmailJob): Promise<void> {
    this.logger.debug(`Sending email verification to ${data.email}`);
    await this.mailService.sendEmailVerification(data.email, data.token);
  }

  async sendPasswordReset(data: IResetPasswordJob): Promise<void> {
    this.logger.debug(`Sending password reset to ${data.email}`);
    await this.mailService.sendPasswordReset(data.email, data.token);
  }

  async sendProjectInvitation(data: IProjectInvitationJob): Promise<void> {
    this.logger.debug(`Sending project invitation to ${data.email}`);
    await this.mailService.sendProjectInvitation(data);
  }

  async sendWorkspaceInvitation(data: IWorkspaceInvitationJob): Promise<void> {
    this.logger.debug(`Sending workspace invitation to ${data.email}`);
    await this.mailService.sendWorkspaceInvitation(data);
  }
}
