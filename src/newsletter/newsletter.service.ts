import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { MasterCategory } from '../master-category/entities/master-category.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { IEmailService } from '../email/interfaces/email-service.interface';
import { EMAIL_SERVICE } from '../email/email.module';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    @InjectRepository(MasterCategory)
    private readonly categoryRepo: Repository<MasterCategory>,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  async subscribe(subscribeDto: SubscribeDto) {
    const { email, masterCategoryIds } = subscribeDto;

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email address');
    }

    // Validate categories
    if (!masterCategoryIds || masterCategoryIds.length === 0) {
      throw new BadRequestException('Please select at least one category');
    }

    // Find categories
    const categories = await this.categoryRepo.find({
      where: { id: In(masterCategoryIds) },
    });

    if (categories.length === 0) {
      throw new BadRequestException('No valid categories found');
    }

    // Check existing subscriber
    let subscriber = await this.subscriberRepo.findOne({
      where: { email },
      relations: ['subscribedCategories'],
    });

    const verificationToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    if (subscriber) {
      // Update existing subscriber - always require re-verification for security
      subscriber.subscribedCategories = categories;
      subscriber.verificationToken = verificationToken;
      subscriber.verificationExpiresAt = expiresAt;
      subscriber.isVerified = false; // Reset verification status
      subscriber.unsubscribedAt = null; // Clear unsubscribe status (re-subscription)
    } else {
      // Create new subscriber
      subscriber = this.subscriberRepo.create({
        email,
        preferenceToken: randomUUID(),
        verificationToken,
        verificationExpiresAt: expiresAt,
        subscribedCategories: categories,
      });
    }

    await this.subscriberRepo.save(subscriber);

    // Send verification email
    const verificationUrl = `${frontendUrl}/newsletter/verify/${subscriber.verificationToken}`;
    const preferencesUrl = `${frontendUrl}/newsletter/preferences/${subscriber.preferenceToken}`;

    await this.emailService.sendNewsletterVerificationEmail(
      subscriber.email,
      verificationUrl,
      preferencesUrl,
      categories.map((cat) => ({
        name: cat.name,
        description: cat.description,
      })),
    );

    return {
      success: true,
      message:
        'Please check your email to verify your subscription. Link valid for 24 hours.',
      subscriber: {
        email: subscriber.email,
        preferenceToken: subscriber.preferenceToken,
      },
    };
  }

  async verify(verificationToken: string) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { verificationToken },
      relations: ['subscribedCategories'],
    });

    if (!subscriber) {
      throw new NotFoundException('Invalid or expired verification link');
    }

    if (subscriber.isVerified) {
      return {
        success: true,
        message: 'Email already verified',
      };
    }

    if (new Date() > subscriber.verificationExpiresAt) {
      throw new BadRequestException('Verification link has expired');
    }

    subscriber.isVerified = true;
    subscriber.verificationToken = null;
    subscriber.verificationExpiresAt = null;

    await this.subscriberRepo.save(subscriber);

    // Send welcome email
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const preferencesUrl = `${frontendUrl}/newsletter/preferences/${subscriber.preferenceToken}`;
    const unsubscribeUrl = `${frontendUrl}/newsletter/unsubscribe/${subscriber.preferenceToken}`;

    await this.emailService.sendNewsletterWelcomeEmail(
      subscriber.email,
      preferencesUrl,
      unsubscribeUrl,
      subscriber.subscribedCategories.map((cat) => ({ name: cat.name })),
    );

    return {
      success: true,
      message:
        "Email verified successfully! You'll start receiving newsletters.",
    };
  }

  async getPreferences(preferenceToken: string) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { preferenceToken },
      relations: ['subscribedCategories'],
    });

    if (!subscriber) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      email: subscriber.email,
      isVerified: subscriber.isVerified,
      subscribedCategories: subscriber.subscribedCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      })),
    };
  }

  async updatePreferences(
    preferenceToken: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    const { masterCategoryIds } = updatePreferencesDto;

    if (!masterCategoryIds || masterCategoryIds.length === 0) {
      throw new BadRequestException('Please select at least one category');
    }

    const subscriber = await this.subscriberRepo.findOne({
      where: { preferenceToken },
      relations: ['subscribedCategories'],
    });

    if (!subscriber) {
      throw new NotFoundException('Subscription not found');
    }

    const categories = await this.categoryRepo.find({
      where: { id: In(masterCategoryIds) },
    });

    subscriber.subscribedCategories = categories;
    await this.subscriberRepo.save(subscriber);

    // Send confirmation email
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const preferencesUrl = `${frontendUrl}/newsletter/preferences/${subscriber.preferenceToken}`;
    const unsubscribeUrl = `${frontendUrl}/newsletter/unsubscribe/${subscriber.preferenceToken}`;

    await this.emailService.sendNewsletterPreferencesUpdatedEmail(
      subscriber.email,
      preferencesUrl,
      unsubscribeUrl,
      categories.map((cat) => ({ name: cat.name })),
    );

    return {
      success: true,
      message: 'Preferences updated successfully',
      subscribedCategories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      })),
    };
  }

  async unsubscribe(preferenceToken: string) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { preferenceToken },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if already unsubscribed
    if (subscriber.unsubscribedAt) {
      return {
        success: true,
        message: 'Already unsubscribed from all newsletters',
      };
    }

    // Soft delete - set unsubscribed timestamp
    subscriber.unsubscribedAt = new Date();
    await this.subscriberRepo.save(subscriber);

    return {
      success: true,
      message: 'Successfully unsubscribed from all newsletters',
    };
  }

  // Admin/utility methods

  async getSubscriberStats() {
    const [
      totalSignups,
      activeSubscribers,
      unsubscribedCount,
      unverifiedCount,
    ] = await Promise.all([
      // Total signups (all time)
      this.subscriberRepo.count(),
      // Active subscribers (verified and not unsubscribed)
      this.subscriberRepo.count({
        where: {
          isVerified: true,
          unsubscribedAt: null,
        },
      }),
      // Unsubscribed count
      this.subscriberRepo
        .createQueryBuilder('subscriber')
        .where('subscriber.unsubscribed_at IS NOT NULL')
        .getCount(),
      // Unverified count
      this.subscriberRepo.count({
        where: {
          isVerified: false,
          unsubscribedAt: null,
        },
      }),
    ]);

    return {
      totalSignups,
      activeSubscribers,
      unsubscribedCount,
      unverifiedCount,
    };
  }

  async getAllSubscribers() {
    const subscribers = await this.subscriberRepo.find({
      where: {
        isVerified: true,
        unsubscribedAt: null, // Exclude unsubscribed users
      },
      relations: ['subscribedCategories'],
    });

    return subscribers.map((sub) => ({
      email: sub.email,
      categories: sub.subscribedCategories.map((cat) => cat.name),
      subscribedAt: sub.createdAt,
    }));
  }

  // Get subscribers by master category (useful for sending targeted newsletters)
  async getSubscribersByCategory(masterCategoryId: number) {
    const subscribers = await this.subscriberRepo
      .createQueryBuilder('subscriber')
      .leftJoinAndSelect(
        'subscriber.subscribedCategories',
        'subscribedCategories',
      )
      .where('subscriber.is_verified = :isVerified', { isVerified: true })
      .andWhere('subscriber.unsubscribed_at IS NULL') // Exclude unsubscribed users
      .andWhere('subscribedCategories.id = :masterCategoryId', {
        masterCategoryId,
      })
      .getMany();

    return subscribers.map((sub) => ({
      email: sub.email,
      preferenceToken: sub.preferenceToken,
      createdAt: sub.createdAt,
    }));
  }
}
