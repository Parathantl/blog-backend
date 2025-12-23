import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { MasterCategory } from 'src/master-category/entities/master-category.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { IEmailService } from 'src/email/interfaces/email-service.interface';
import { EMAIL_SERVICE } from 'src/email/email.module';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    @InjectRepository(MasterCategory)
    private readonly masterCategoryRepo: Repository<MasterCategory>,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  async subscribe(subscribeDto: SubscribeDto) {
    const { email, masterCategoryIds } = subscribeDto;

    // Validate master categories exist
    const masterCategories = await this.masterCategoryRepo.find({
      where: { id: In(masterCategoryIds) },
    });

    if (masterCategories.length === 0) {
      throw new BadRequestException('No valid categories found');
    }

    if (masterCategories.length !== masterCategoryIds.length) {
      throw new BadRequestException('Some categories do not exist');
    }

    // Check if subscriber already exists
    const existingSubscriber = await this.subscriberRepo.findOne({
      where: { email },
      relations: ['masterCategories'],
    });

    if (existingSubscriber) {
      // If already verified and active
      if (existingSubscriber.isVerified && existingSubscriber.isActive) {
        // Update categories if different
        const existingCategoryIds = existingSubscriber.masterCategories.map(
          (cat) => cat.id,
        );
        const hasNewCategories = masterCategoryIds.some(
          (id) => !existingCategoryIds.includes(id),
        );

        if (hasNewCategories) {
          existingSubscriber.masterCategories = masterCategories;
          await this.subscriberRepo.save(existingSubscriber);

          return {
            success: true,
            message: 'Subscription preferences updated successfully',
          };
        }

        return {
          success: true,
          message: 'You are already subscribed to these categories',
        };
      }

      // If not verified or inactive, resend verification
      existingSubscriber.masterCategories = masterCategories;
      existingSubscriber.isActive = false;
      existingSubscriber.isVerified = false;
      existingSubscriber.verificationToken = this.generateVerificationToken();
      existingSubscriber.verificationTokenExpiry = this.getTokenExpiry();

      await this.subscriberRepo.save(existingSubscriber);

      // Send verification email
      await this.sendVerificationEmail(
        existingSubscriber.email,
        existingSubscriber.verificationToken,
      );

      return {
        success: true,
        message:
          'Please check your email to verify your subscription. Link valid for 24 hours.',
      };
    }

    // Create new subscriber
    const subscriber = new NewsletterSubscriber();
    subscriber.email = email;
    subscriber.masterCategories = masterCategories;
    subscriber.isActive = false; // Will be activated upon verification
    subscriber.isVerified = false;
    subscriber.verificationToken = this.generateVerificationToken();
    subscriber.verificationTokenExpiry = this.getTokenExpiry();

    await this.subscriberRepo.save(subscriber);

    // Send verification email
    try {
      await this.sendVerificationEmail(
        subscriber.email,
        subscriber.verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw - subscriber is saved, they can request resend later
    }

    return {
      success: true,
      message:
        'Please check your email to verify your subscription. Link valid for 24 hours.',
    };
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24 hours from now
    return expiry;
  }

  private async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/newsletter/verify?token=${token}`;

    await this.emailService.sendVerificationEmail(email, verificationUrl);
  }

  async verifySubscription(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // Find subscriber by token
    const subscriber = await this.subscriberRepo.findOne({
      where: { verificationToken: token },
      relations: ['masterCategories'],
    });

    if (!subscriber) {
      throw new BadRequestException('Invalid verification token');
    }

    // Check if token is expired
    if (
      subscriber.verificationTokenExpiry &&
      new Date() > subscriber.verificationTokenExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please subscribe again.',
      );
    }

    // Check if already verified
    if (subscriber.isVerified && subscriber.isActive) {
      return {
        success: true,
        message: 'Email already verified',
        subscriber: {
          email: subscriber.email,
          categories: subscriber.masterCategories.map((cat) => cat.name),
        },
      };
    }

    // Activate subscription
    subscriber.isVerified = true;
    subscriber.isActive = true;
    subscriber.verifiedAt = new Date();
    subscriber.verificationToken = null;
    subscriber.verificationTokenExpiry = null;

    await this.subscriberRepo.save(subscriber);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        subscriber.email,
        subscriber.masterCategories.map((cat) => cat.name),
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw - verification succeeded
    }

    return {
      success: true,
      message: 'Email verified successfully! Welcome to our newsletter.',
      subscriber: {
        email: subscriber.email,
        categories: subscriber.masterCategories.map((cat) => cat.name),
      },
    };
  }

  async unsubscribe(unsubscribeDto: UnsubscribeDto) {
    const { email } = unsubscribeDto;

    const subscriber = await this.subscriberRepo.findOne({
      where: { email },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    if (!subscriber.isActive) {
      return {
        success: true,
        message: 'You are already unsubscribed',
      };
    }

    // Soft delete - mark as inactive instead of deleting
    subscriber.isActive = false;
    await this.subscriberRepo.save(subscriber);

    return {
      success: true,
      message: 'Successfully unsubscribed from the newsletter',
    };
  }

  async updateSubscription(updateSubscriptionDto: UpdateSubscriptionDto) {
    const { email, masterCategoryIds } = updateSubscriptionDto;

    const subscriber = await this.subscriberRepo.findOne({
      where: { email },
      relations: ['masterCategories'],
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    if (!subscriber.isActive) {
      throw new BadRequestException(
        'Subscription is inactive. Please subscribe again.',
      );
    }

    // Validate master categories
    const masterCategories = await this.masterCategoryRepo.find({
      where: { id: In(masterCategoryIds) },
    });

    if (masterCategories.length === 0) {
      throw new BadRequestException('No valid categories found');
    }

    if (masterCategories.length !== masterCategoryIds.length) {
      throw new BadRequestException('Some categories do not exist');
    }

    subscriber.masterCategories = masterCategories;
    await this.subscriberRepo.save(subscriber);

    return {
      success: true,
      message: 'Subscription preferences updated successfully',
      subscriber: {
        email: subscriber.email,
        categories: masterCategories.map((cat) => cat.name),
      },
    };
  }

  async getSubscriber(email: string) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { email },
      relations: ['masterCategories'],
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    return {
      email: subscriber.email,
      isActive: subscriber.isActive,
      categories: subscriber.masterCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
      subscribedAt: subscriber.subscribedAt,
    };
  }

  async getAllSubscribers() {
    const subscribers = await this.subscriberRepo.find({
      where: { isActive: true },
      relations: ['masterCategories'],
    });

    return subscribers.map((sub) => ({
      email: sub.email,
      categories: sub.masterCategories.map((cat) => cat.name),
      subscribedAt: sub.subscribedAt,
    }));
  }

  // Get subscribers by master category (useful for sending targeted newsletters)
  async getSubscribersByMasterCategory(masterCategoryId: number) {
    const subscribers = await this.subscriberRepo
      .createQueryBuilder('subscriber')
      .leftJoinAndSelect('subscriber.masterCategories', 'masterCategory')
      .where('subscriber.isActive = :isActive', { isActive: true })
      .andWhere('masterCategory.id = :masterCategoryId', { masterCategoryId })
      .getMany();

    return subscribers.map((sub) => ({
      email: sub.email,
      subscribedAt: sub.subscribedAt,
    }));
  }
}
