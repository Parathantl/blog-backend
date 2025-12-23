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
}
