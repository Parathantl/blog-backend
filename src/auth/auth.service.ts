import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-auth.dto';
import { User } from './entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserLoginDto } from './dto/user-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private transporter;

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize email transporter with timeouts
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      // Add timeouts to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    });
  }

  async login(loginDto: UserLoginDto) {
    const user = await this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    } else {
      // verify that supplied password hash is matching the password hash in databases
      if (await this.verifyPassword(loginDto.password, user.password)) {
        const token = await this.jwtService.signAsync({
          email: user.email,
          id: user.id,
        });

        delete user.password;
        return { token, user };
      } else {
        throw new UnauthorizedException('Bad credentials');
      }
    }
  }

  async register(createUserDto: CreateUserDto) {
    console.log('createUserDto::', createUserDto);
    const { firstname, lastname, email, password, profilePic } = createUserDto;

    const checkUser = await this.repo.findOne({ where: { email } });

    if (checkUser) {
      throw new BadRequestException('Please enter different email');
    } else {
      const user = new User();
      user.firstname = firstname;
      user.lastname = lastname;
      user.email = email;
      user.password = password;
      user.profilePic = profilePic;

      Object.assign(user, createUserDto);
      this.repo.create(user);
      await this.repo.save(user);
      delete user.password;
      return user;
    }
  }

  async verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }

  async getOneUser(id: number) {
    return await this.repo.findOne({ where: { id } });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.repo.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists for security
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Create password reset record
    const passwordReset = this.passwordResetRepo.create({
      token: hashedToken,
      user: user,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    await this.passwordResetRepo.save(passwordReset);

    // Send reset email asynchronously (don't wait for it)
    const frontendResetUrl = `${this.configService.get<string>('ALLOWED_ORIGINS')?.split(',')[0]}/reset-password?token=${resetToken}`;

    // Fire and forget - send email in background
    this.sendResetEmail(user.email, frontendResetUrl).catch((error) => {
      console.error('Failed to send reset email:', error);
      // Don't throw - we already saved the token, email failure shouldn't block response
    });

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password, confirmPassword } = resetPasswordDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Hash the token to find it in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const passwordReset = await this.passwordResetRepo.findOne({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update user password
    const user = passwordReset.user;
    user.password = await bcrypt.hash(password, 10);
    await this.repo.save(user);

    // Mark token as used
    passwordReset.used = true;
    await this.passwordResetRepo.save(passwordReset);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  private async sendResetEmail(email: string, resetUrl: string) {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}"
             style="display: inline-block;
                    padding: 12px 24px;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated email, please do not reply.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Reset email sent to:', email);
    } catch (error) {
      console.error('Error sending reset email:', error);
      // Don't throw error - we don't want to reveal if email exists
    }
  }
}
