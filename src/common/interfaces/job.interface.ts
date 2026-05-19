export interface IEmailJob {
  email: string;
}

export interface IVerifyEmailJob extends IEmailJob {
  token: string;
}

export interface IResetPasswordJob extends IEmailJob {
  token: string;
}
