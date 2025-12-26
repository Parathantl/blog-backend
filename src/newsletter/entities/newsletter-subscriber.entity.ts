import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { MasterCategory } from '../../master-category/entities/master-category.entity';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, name: 'preference_token' })
  preferenceToken: string;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ nullable: true, name: 'verification_token' })
  verificationToken: string;

  @Column({ nullable: true, name: 'verification_expires_at' })
  verificationExpiresAt: Date;

  @ManyToMany(() => MasterCategory, { eager: true })
  @JoinTable({
    name: 'newsletter_subscriber_categories',
    joinColumn: { name: 'subscriber_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'master_category_id',
      referencedColumnName: 'id',
    },
  })
  subscribedCategories: MasterCategory[];

  @Column({ nullable: true, name: 'unsubscribed_at' })
  unsubscribedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
