import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'int', default: 50 })
  proficiencyLevel: number;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ default: 1 })
  displayOrder: number;

  @Column({ default: true })
  isVisible: boolean;
}
