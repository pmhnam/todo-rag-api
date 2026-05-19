export interface IEmailJob {
  email: string;
}

export interface IVerifyEmailJob extends IEmailJob {
  token: string;
}

export interface IResetPasswordJob extends IEmailJob {
  token: string;
}

export interface IProjectInvitationJob extends IEmailJob {
  inviterName: string;
  projectName: string;
  token: string;
  permission: string;
  expiresAt: string;
}
