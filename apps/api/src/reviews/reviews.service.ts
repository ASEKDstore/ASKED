import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateReviewDto } from './dto/create-review.dto';
import type { CreateReviewReplyDto } from './dto/create-review-reply.dto';
import type { ReviewQueryDto } from './dto/review-query.dto';
import type { ReviewDto, ReviewsListResponse } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  private readonly reviewsRequirePurchase: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Default to true: require purchase verification by default
    this.reviewsRequirePurchase = this.configService.get<string>('REVIEWS_REQUIRE_PURCHASE', 'true') === 'true';
  }

  /**
   * Create a new review
   */
  async create(userId: string, createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const { productId, orderId, rating, text, media } = createReviewDto;

    // Validate media count (already validated in DTO, but double-check)
    if (media && media.length > 5) {
      throw new BadRequestException('Maximum 5 media files allowed');
    }

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Verified purchase validation
    if (this.reviewsRequirePurchase) {
      if (!orderId) {
        throw new ForbiddenException('Purchase verification required. Please provide orderId.');
      }

      // Verify order belongs to user, contains product, and is not soft-deleted
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          deletedAt: null, // Exclude soft-deleted orders
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found or does not belong to user');
      }

      const hasProduct = order.items.some((item) => item.productId === productId);
      if (!hasProduct) {
        throw new BadRequestException('Order does not contain this product');
      }
    } else {
      // If orderId provided (optional when not required), verify it belongs to the user and contains the product
      if (orderId) {
        const order = await this.prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
            deletedAt: null, // Exclude soft-deleted orders
          },
          include: {
            items: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found or does not belong to user');
        }

        const hasProduct = order.items.some((item) => item.productId === productId);
        if (!hasProduct) {
          throw new BadRequestException('Order does not contain this product');
        }
      }
    }

    // Check if user already reviewed this product (unique constraint will also prevent duplicates)
    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('User has already reviewed this product');
    }

    // Create review with media
    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        orderId: orderId || null,
        rating,
        text: text || null,
        status: 'PENDING',
        media: {
          create: media?.map((m) => ({
            type: m.type,
            url: m.url,
          })) || [],
        },
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    return this.mapToDto(review);
  }

  /**
   * Get reviews for a product (approved only)
   */
  async findByProduct(productId: string, query: ReviewQueryDto): Promise<ReviewsListResponse> {
    const { page, pageSize, rating, withMedia } = query;

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const where: {
      productId: string;
      status: 'APPROVED';
      rating?: number;
      media?: { some: {} };
    } = {
      productId,
      status: 'APPROVED',
    };

    // Filter by rating if provided
    if (rating !== undefined) {
      where.rating = rating;
    }

    // Filter by media presence if provided
    if (withMedia === true) {
      where.media = { some: {} };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: reviews.map((r) => this.mapToListItemDto(r)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get all approved reviews (public)
   */
  async findAllApproved(query: ReviewQueryDto): Promise<ReviewsListResponse> {
    const { page, pageSize, rating, withMedia } = query;

    const where: {
      status: 'APPROVED';
      rating?: number;
      media?: { some: {} };
    } = {
      status: 'APPROVED',
    };

    // Filter by rating if provided
    if (rating !== undefined) {
      where.rating = rating;
    }

    // Filter by media presence if provided
    if (withMedia === true) {
      where.media = { some: {} };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: reviews.map((r) => this.mapToListItemDto(r)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get user's reviews
   */
  async findByUser(userId: string, query: ReviewQueryDto): Promise<ReviewsListResponse> {
    const { page, pageSize, status } = query;

    const where: {
      userId: string;
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    } = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: reviews.map((r) => this.mapToListItemDto(r)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get all reviews (admin)
   */
  async findAll(query: ReviewQueryDto): Promise<ReviewsListResponse> {
    const { page, pageSize, status, productId, userId } = query;

    const where: {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      productId?: string;
      userId?: string;
    } = {};

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: reviews.map((r) => this.mapToListItemDto(r)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Approve a review (admin) - uses transaction
   */
  async approve(reviewId: string): Promise<ReviewDto> {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      });

      if (!review) {
        throw new NotFoundException(`Review with id ${reviewId} not found`);
      }

      if (review.status === 'APPROVED') {
        throw new BadRequestException('Review is already approved');
      }

      // Update review status
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: 'APPROVED',
        },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      });

      // Recalculate product rating since status changed to APPROVED
      await this.recalculateProductRating(review.productId, tx);

      return this.mapToDto(updatedReview);
    });
  }

  /**
   * Reject a review (admin) - uses transaction
   */
  async reject(reviewId: string): Promise<ReviewDto> {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      });

      if (!review) {
        throw new NotFoundException(`Review with id ${reviewId} not found`);
      }

      if (review.status === 'REJECTED') {
        throw new BadRequestException('Review is already rejected');
      }

      const oldStatus = review.status;

      // Update review status
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: 'REJECTED',
        },
        include: {
          media: true,
          reply: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      });

      // Recalculate product rating if status changed from APPROVED
      if (oldStatus === 'APPROVED') {
        await this.recalculateProductRating(review.productId, tx);
      }

      return this.mapToDto(updatedReview);
    });
  }

  /**
   * Add or update a reply to a review (admin)
   */
  async addReply(reviewId: string, createReplyDto: CreateReviewReplyDto, adminId?: string): Promise<ReviewDto> {
    const { text } = createReplyDto;

    // Verify review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }

    // Upsert reply (create if doesn't exist, update if exists)
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: {
          upsert: {
            create: {
              text,
              adminId: adminId || null,
            },
            update: {
              text,
              adminId: adminId || null,
            },
          },
        },
      },
      include: {
        media: true,
        reply: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    return this.mapToDto(updatedReview);
  }

  /**
   * Delete a reply from a review (admin)
   */
  async deleteReply(reviewId: string): Promise<ReviewDto> {
    // Verify review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }

    // Delete reply if exists
    await this.prisma.reviewReply.deleteMany({
      where: { reviewId },
    });

    // Return updated review (without reply)
    const updatedReview = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!updatedReview) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }

    return this.mapToDto(updatedReview);
  }

  /**
   * Recalculate product average rating and counts from approved reviews
   * Uses Prisma aggregate/groupBy for efficiency
   */
  private async recalculateProductRating(
    productId: string,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> | PrismaService,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    // Get rating breakdown using groupBy
    const ratingGroups = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'APPROVED',
      },
      _count: {
        rating: true,
      },
    });

    // Calculate counts for each rating
    const rating1Count = ratingGroups.find((g) => g.rating === 1)?._count.rating ?? 0;
    const rating2Count = ratingGroups.find((g) => g.rating === 2)?._count.rating ?? 0;
    const rating3Count = ratingGroups.find((g) => g.rating === 3)?._count.rating ?? 0;
    const rating4Count = ratingGroups.find((g) => g.rating === 4)?._count.rating ?? 0;
    const rating5Count = ratingGroups.find((g) => g.rating === 5)?._count.rating ?? 0;

    const reviewsCount = rating1Count + rating2Count + rating3Count + rating4Count + rating5Count;

    // Calculate average rating
    const totalRating = rating1Count * 1 + rating2Count * 2 + rating3Count * 3 + rating4Count * 4 + rating5Count * 5;
    const averageRating = reviewsCount > 0 ? totalRating / reviewsCount : 0;

    // Update product aggregates (handle empty sets: set to 0)
    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating,
        reviewsCount,
        rating1Count,
        rating2Count,
        rating3Count,
        rating4Count,
        rating5Count,
      },
    });
  }

  private mapToDto(review: {
    id: string;
    productId: string;
    userId: string;
    orderId: string | null;
    rating: number;
    text: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    media: Array<{
      id: string;
      type: string;
      url: string;
      createdAt: Date;
    }>;
    reply?: {
      id: string;
      reviewId: string;
      adminId: string | null;
      text: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
    };
  }): ReviewDto {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      orderId: review.orderId,
      rating: review.rating,
      text: review.text,
      status: review.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      media: review.media.map((m) => ({
        id: m.id,
        type: m.type as 'IMAGE' | 'VIDEO',
        url: m.url,
        createdAt: m.createdAt,
      })),
      reply: review.reply
        ? {
            id: review.reply.id,
            reviewId: review.reply.reviewId,
            adminId: review.reply.adminId,
            text: review.reply.text,
            createdAt: review.reply.createdAt,
            updatedAt: review.reply.updatedAt,
          }
        : null,
      user: {
        id: review.user.id,
        username: review.user.username,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        photoUrl: review.user.photoUrl,
      },
    };
  }

  private mapToListItemDto(review: {
    id: string;
    productId: string;
    userId: string;
    orderId: string | null;
    rating: number;
    text: string | null;
    status: string;
    createdAt: Date;
    media: Array<{
      id: string;
      type: string;
      url: string;
      createdAt: Date;
    }>;
    reply?: {
      id: string;
      reviewId: string;
      adminId: string | null;
      text: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
    };
  }): {
    id: string;
    productId: string;
    userId: string;
    orderId: string | null;
    rating: number;
    text: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    media: Array<{
      id: string;
      type: 'IMAGE' | 'VIDEO';
      url: string;
      createdAt: Date;
    }>;
    reply?: {
      id: string;
      reviewId: string;
      adminId: string | null;
      text: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
    };
  } {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      orderId: review.orderId,
      rating: review.rating,
      text: review.text,
      status: review.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      createdAt: review.createdAt,
      media: review.media.map((m) => ({
        id: m.id,
        type: m.type as 'IMAGE' | 'VIDEO',
        url: m.url,
        createdAt: m.createdAt,
      })),
      reply: review.reply
        ? {
            id: review.reply.id,
            reviewId: review.reply.reviewId,
            adminId: review.reply.adminId,
            text: review.reply.text,
            createdAt: review.reply.createdAt,
            updatedAt: review.reply.updatedAt,
          }
        : null,
      user: {
        id: review.user.id,
        username: review.user.username,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        photoUrl: review.user.photoUrl,
      },
    };
  }
}
