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

  // Newsletter-specific methods
  sendNewsletterVerificationEmail(
    email: string,
    verificationUrl: string,
    preferencesUrl: string,
    categories: Array<{ name: string; description?: string }>,
  ): Promise<void>;

  sendNewsletterWelcomeEmail(
    email: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
    categories: Array<{ name: string }>,
  ): Promise<void>;

  sendNewsletterPreferencesUpdatedEmail(
    email: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
    categories: Array<{ name: string }>,
  ): Promise<void>;

  sendNewsletter(
    email: string,
    subject: string,
    htmlContent: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
  ): Promise<void>;
}
