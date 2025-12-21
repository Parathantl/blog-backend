import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  company: string;

  @Column()
  position: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  responsibilities: string[];

  @Column('simple-array', { nullable: true })
  technologies: string[];

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ default: false })
  isCurrent: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  companyUrl: string;

  @Column({ default: 1 })
  displayOrder: number;
}
