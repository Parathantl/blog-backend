import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  IEmailService,
  EmailOptions,
} from '../interfaces/email-service.interface';

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerEmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: options.from || this.configService.get('EMAIL_USER'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    userName?: string,
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
              color: #333;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
            h1 { margin: 0 0 10px 0; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📧 Verify Your Email</h1>
            <p>Almost there! Let's confirm your subscription.</p>
          </div>

          <div class="content">
            <p>Hi${userName ? ' ' + userName : ''},</p>

            <p>Thank you for subscribing to our newsletter! To complete your subscription and start receiving updates, please verify your email address.</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✓ Verify Email Address
              </a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>

            <p><strong>This link will expire in 24 hours.</strong></p>

            <div class="footer">
              <p>If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} Parathan's Blog. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '✓ Verify Your Newsletter Subscription',
      html,
    });
  }

  async sendWelcomeEmail(
    email: string,
    categories: string[],
    userName?: string,
  ): Promise<void> {
    const categoryList = categories.map((cat) => `<li>${cat}</li>`).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
              color: #333;
            }
            .categories {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
            h1 { margin: 0 0 10px 0; }
            h2 { color: #667eea; margin-top: 0; }
            p { margin: 10px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to Our Newsletter!</h1>
            <p>Your subscription is now active</p>
          </div>

          <div class="content">
            <p>Hi${userName ? ' ' + userName : ''},</p>

            <p>Great news! Your email has been verified and you're now subscribed to our newsletter.</p>

            <div class="categories">
              <h2>📚 You're subscribed to:</h2>
              <ul>
                ${categoryList}
              </ul>
            </div>

            <p>You'll receive updates about new posts, exclusive content, and insights in these categories.</p>

            <p><strong>What to expect:</strong></p>
            <ul>
              <li>Quality content delivered to your inbox</li>
              <li>No spam - we respect your inbox</li>
              <li>Unsubscribe anytime with one click</li>
            </ul>

            <p>Thank you for joining our community!</p>

            <p>Best regards,<br/>
            <strong>Parathan</strong></p>

            <div class="footer">
              <p>You can manage your subscription preferences or unsubscribe at any time.</p>
              <p>© ${new Date().getFullYear()} Parathan's Blog. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎉 Welcome! Your Subscription is Active',
      html,
    });
  }

  // Newsletter-specific email methods
  async sendNewsletterVerificationEmail(
    email: string,
    verificationUrl: string,
    preferencesUrl: string,
    categories: Array<{ name: string; description?: string }>,
  ): Promise<void> {
    const categoryList = categories
      .map(
        (cat) =>
          `<li><strong>${cat.name}</strong>${cat.description ? ` - ${cat.description}` : ''}</li>`,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              border-radius: 10px;
              padding: 40px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
              color: #333;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .categories {
              background: #f3f4f6;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .footer a {
              color: #2563eb;
              text-decoration: none;
            }
            h1 { margin: 0 0 10px 0; }
            p { margin: 10px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📧 Verify Your Newsletter Subscription</h1>
            <p>Thanks for subscribing! Just one more step...</p>
          </div>

          <div class="content">
            <p>Hi there!</p>

            <p>Thank you for subscribing to our newsletter. You've chosen to receive updates for:</p>

            <div class="categories">
              <ul>
                ${categoryList}
              </ul>
            </div>

            <p>Please verify your email address by clicking the button below:</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✓ Verify Email Address
              </a>
            </div>

            <p style="color: #ef4444; font-weight: 600;">⏰ This link will expire in 24 hours.</p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 12px;">${verificationUrl}</p>

            <div class="footer">
              <p>Not expecting this email? You can safely ignore it.</p>
              <p>
                <a href="${preferencesUrl}">Manage your preferences</a> |
                © ${new Date().getFullYear()} Parathan's Blog
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '✓ Verify Your Newsletter Subscription',
      html,
    });
  }

  async sendNewsletterWelcomeEmail(
    email: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
    categories: Array<{ name: string }>,
  ): Promise<void> {
    const categoryList = categories
      .map((cat) => `<li>${cat.name}</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-radius: 10px;
              padding: 40px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
              color: #333;
            }
            .button {
              display: inline-block;
              padding: 12px 28px;
              background: #6b7280;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 10px 0;
            }
            .categories {
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .footer a {
              color: #2563eb;
              text-decoration: none;
            }
            h1 { margin: 0 0 10px 0; }
            h2 { color: #10b981; margin-top: 0; }
            p { margin: 10px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to Our Newsletter!</h1>
            <p>Your email has been verified successfully</p>
          </div>

          <div class="content">
            <p>Hi there!</p>

            <p>Great news! Your email has been verified and you're now subscribed to our newsletter.</p>

            <div class="categories">
              <h2>📚 You're subscribed to:</h2>
              <ul>
                ${categoryList}
              </ul>
            </div>

            <p><strong>What to expect:</strong></p>
            <ul>
              <li>✨ Quality content delivered to your inbox</li>
              <li>🔒 No spam - we respect your privacy</li>
              <li>⚙️ Manage preferences anytime</li>
              <li>📧 Unsubscribe with one click</li>
            </ul>

            <p>You can manage your subscription preferences at any time:</p>

            <div style="text-align: center;">
              <a href="${preferencesUrl}" class="button">
                ⚙️ Manage Preferences
              </a>
            </div>

            <p>Thank you for joining our community!</p>

            <p>Best regards,<br/>
            <strong>Parathan</strong></p>

            <div class="footer">
              <p>
                <a href="${preferencesUrl}">Update preferences</a> |
                <a href="${unsubscribeUrl}" style="color: #dc2626;">Unsubscribe</a>
              </p>
              <p>© ${new Date().getFullYear()} Parathan's Blog. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎉 Welcome! Your Newsletter Subscription is Active',
      html,
    });
  }

  async sendNewsletterPreferencesUpdatedEmail(
    email: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
    categories: Array<{ name: string }>,
  ): Promise<void> {
    const categoryList = categories
      .map((cat) => `<li>${cat.name}</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
              border-radius: 10px;
              padding: 40px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
              color: #333;
            }
            .categories {
              background: #f5f3ff;
              border-left: 4px solid #8b5cf6;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .footer a {
              color: #2563eb;
              text-decoration: none;
            }
            h1 { margin: 0 0 10px 0; }
            h2 { color: #8b5cf6; margin-top: 0; }
            p { margin: 10px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Preferences Updated</h1>
            <p>Your subscription preferences have been saved</p>
          </div>

          <div class="content">
            <p>Hi there!</p>

            <p>Your newsletter subscription preferences have been updated successfully.</p>

            <div class="categories">
              <h2>📚 You're now subscribed to:</h2>
              <ul>
                ${categoryList}
              </ul>
            </div>

            <p>You'll receive updates about new posts and content in these categories.</p>

            <p>Want to make changes? You can update your preferences anytime.</p>

            <div class="footer">
              <p>
                <a href="${preferencesUrl}">Update preferences</a> |
                <a href="${unsubscribeUrl}" style="color: #dc2626;">Unsubscribe</a>
              </p>
              <p>© ${new Date().getFullYear()} Parathan's Blog. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '✓ Newsletter Preferences Updated',
      html,
    });
  }

  async sendNewsletter(
    email: string,
    subject: string,
    htmlContent: string,
    preferencesUrl: string,
    unsubscribeUrl: string,
  ): Promise<void> {
    const footer = `
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <div style="font-size: 12px; color: #6b7280; text-align: center;">
        <p>You're receiving this because you subscribed to our newsletter.</p>
        <p>
          <a href="${preferencesUrl}" style="color: #2563eb; text-decoration: none;">Manage your preferences</a> |
          <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin-top: 10px;">© ${new Date().getFullYear()} Parathan's Blog. All rights reserved.</p>
      </div>
    `;

    const completeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${htmlContent}
            ${footer}
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html: completeHtml,
    });
  }
}
