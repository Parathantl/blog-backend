import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  longDescription: string;

  @Column('simple-array')
  technologies: string[];

  @Column({ nullable: true })
  projectUrl: string;

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('simple-array', { nullable: true })
  galleryImages: string[];

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: true })
  featured: boolean;

  @Column({ default: 1 })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
