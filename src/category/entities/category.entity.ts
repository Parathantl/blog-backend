import { IsNotEmpty } from 'class-validator';
import { Post } from 'src/post/entities/post.entity';
import { MasterCategory } from 'src/master-category/entities/master-category.entity';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ default: 1 })
  displayOrder: number;

  @Column({ nullable: true })
  masterCategoryId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => MasterCategory,
    (masterCategory) => masterCategory.categories,
    {
      eager: true,
    },
  )
  @JoinColumn({
    name: 'masterCategoryId',
    referencedColumnName: 'id',
  })
  masterCategory: MasterCategory;

  @ManyToMany(() => Post, (post) => post.categories)
  posts: Post[];
}
