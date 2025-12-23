import { IsEmail, IsNotEmpty } from 'class-validator';
import { MasterCategory } from 'src/master-category/entities/master-category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  verificationTokenExpiry: Date;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  subscribedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => MasterCategory, (masterCategory) => masterCategory.id, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: 'subscriber_master_categories',
    joinColumn: { name: 'subscriber_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'master_category_id',
      referencedColumnName: 'id',
    },
  })
  masterCategories: MasterCategory[];
}
