import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Category } from 'src/category/entities/category.entity';
import { Repository, In } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly repo: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(createPostDto: CreatePostDto, user: User) {
    const post = new Post();
    post.userId = user.id;

    const { categoryIds, ...postData } = createPostDto;
    Object.assign(post, postData);

    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepo.find({
        where: { id: In(categoryIds) },
      });

      if (categories.length === 0) {
        throw new BadRequestException('No valid categories found');
      }

      // Validate all categories belong to the same master category
      const masterCategoryIds = [
        ...new Set(categories.map((cat) => cat.masterCategoryId)),
      ];
      if (masterCategoryIds.length > 1) {
        throw new BadRequestException(
          'All categories must belong to the same master category',
        );
      }

      post.categories = categories;
    }

    return await this.repo.save(post);
  }

  async findAll(query?: string) {
    const myQuery = this.repo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('category.masterCategory', 'masterCategory')
      .leftJoinAndSelect('post.user', 'user');

    // check if query is present or not
    if (!(Object.keys(query).length === 0) && query.constructor === Object) {
      const queryKeys = Object.keys(query);

      // check if title key is present
      if (queryKeys.includes('title')) {
        myQuery.where('post.title LIKE :title', {
          title: `%${query['title']}%`,
        });
      }

      // check if the sort key is present, we will sort by title field only
      if (queryKeys.includes('sort')) {
        myQuery.orderBy('post.title', query['sort'].toUpperCase()); // ASC or DESC
      }

      // check if category is present, show only selected category items
      if (queryKeys.includes('category')) {
        myQuery.andWhere('category.title = :cat', { cat: query['category'] });
      }

      // Filter by master category
      if (queryKeys.includes('masterCategory')) {
        myQuery.andWhere('masterCategory.slug = :masterCat', {
          masterCat: query['masterCategory'],
        });
      }

      // Add default ordering by createdOn (newest first) if no sort specified
      if (!queryKeys.includes('sort')) {
        myQuery.orderBy('post.createdOn', 'DESC');
      }

      return await myQuery.getMany();
    } else {
      // Add default ordering by createdOn (newest first)
      myQuery.orderBy('post.createdOn', 'DESC');
      return await myQuery.getMany();
    }
  }

  async findOne(id: number) {
    const post = this.repo.findOne({ where: { id } });
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    return post;
  }

  async uploadPhoto(file: Express.Multer.File) {
    return { success: true, file };
  }

  async findBySlug(slug: string) {
    try {
      const post = await this.repo.findOneOrFail({
        where: { slug },
        relations: ['categories', 'categories.masterCategory', 'user'],
      });
      return post;
    } catch (err) {
      throw new BadRequestException(`Post with slug ${slug} not found`);
    }
  }

  async findRelatedPosts(slug: string, limit: number = 4): Promise<Post[]> {
    // Get the current post with its categories
    const currentPost = await this.repo.findOne({
      where: { slug },
      relations: ['categories', 'categories.masterCategory'],
    });

    if (!currentPost) {
      throw new BadRequestException('Post not found');
    }

    // Handle posts with no categories - return recent posts instead
    if (!currentPost.categories || currentPost.categories.length === 0) {
      return await this.repo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.categories', 'category')
        .leftJoinAndSelect('category.masterCategory', 'masterCategory')
        .leftJoinAndSelect('post.user', 'user')
        .where('post.id != :currentPostId', { currentPostId: currentPost.id })
        .orderBy('post.createdOn', 'DESC')
        .limit(limit)
        .getMany();
    }

    // Get category IDs and master category IDs
    const categoryIds = currentPost.categories.map((cat) => cat.id);
    const masterCategoryIds = [
      ...new Set(
        currentPost.categories
          .map((cat) => cat.masterCategoryId)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    // Build query for related posts
    const queryBuilder = this.repo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('category.masterCategory', 'masterCategory')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.id != :currentPostId', { currentPostId: currentPost.id });

    // Add category/master category filter if we have any
    if (categoryIds.length > 0 || masterCategoryIds.length > 0) {
      queryBuilder.andWhere(
        '(category.id IN (:...categoryIds) OR category.masterCategoryId IN (:...masterCategoryIds))',
        {
          categoryIds: categoryIds.length > 0 ? categoryIds : [0],
          masterCategoryIds:
            masterCategoryIds.length > 0 ? masterCategoryIds : [0],
        },
      );
    }

    const relatedPosts = await queryBuilder
      .orderBy('RANDOM()') // PostgreSQL random function
      .limit(limit)
      .getMany();

    return relatedPosts;
  }

  async update(slug: string, updatePostDto: UpdatePostDto) {
    const post = await this.repo.findOne({
      where: { slug },
      relations: ['categories'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    post.modifiedOn = new Date(Date.now());

    const { categoryIds, ...postData } = updatePostDto as any;

    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepo.find({
        where: { id: In(categoryIds) },
      });

      if (categories.length === 0) {
        throw new BadRequestException('No valid categories found');
      }

      // Validate all categories belong to the same master category
      const masterCategoryIds = [
        ...new Set(categories.map((cat) => cat.masterCategoryId)),
      ];
      if (masterCategoryIds.length > 1) {
        throw new BadRequestException(
          'All categories must belong to the same master category',
        );
      }

      post.categories = categories;
    }

    Object.assign(post, postData);
    return this.repo.save(post);
  }

  async remove(id: number) {
    const post = await this.repo.findOne({ where: { id } });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    await this.repo.remove(post);

    return { success: true, post };
  }
}
