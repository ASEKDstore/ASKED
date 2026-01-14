import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';

import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { UsersService } from '../users/users.service';

import { createReviewSchema } from './dto/create-review.dto';
import { reviewQuerySchema } from './dto/review-query.dto';
import type { ReviewDto, ReviewsListResponse } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(TelegramAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTelegramUser() telegramUser: TelegramUser,
    @Body() body: unknown,
  ): Promise<ReviewDto> {
    const createReviewDto = createReviewSchema.parse(body);

    // Get user ID from database
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    const userId = user.id;

    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async findMyReviews(
    @CurrentTelegramUser() telegramUser: TelegramUser,
    @Query() query: unknown,
  ): Promise<ReviewsListResponse> {
    const reviewQuery = reviewQuerySchema.parse(query);

    // Get user ID from database
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    const userId = user.id;

    return this.reviewsService.findByUser(userId, reviewQuery);
  }
}

