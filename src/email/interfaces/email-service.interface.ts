export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;

  sendVerificationEmail(
    email: string,
    verificationUrl: string,
    userName?: string,
  ): Promise<void>;

  sendWelcomeEmail(
    email: string,
    categories: string[],
    userName?: string,
  ): Promise<void>;
}
