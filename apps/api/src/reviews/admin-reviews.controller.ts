import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { UsersService } from '../users/users.service';

import { createReviewReplySchema } from './dto/create-review-reply.dto';
import { reviewQuerySchema } from './dto/review-query.dto';
import type { ReviewDto, ReviewsListResponse } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('admin/reviews')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(@Query() query: unknown): Promise<ReviewsListResponse> {
    const reviewQuery = reviewQuerySchema.parse(query);
    return this.reviewsService.findAll(reviewQuery);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string): Promise<ReviewDto> {
    return this.reviewsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string): Promise<ReviewDto> {
    return this.reviewsService.reject(id);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  async addReply(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request & { user?: TelegramUser },
  ): Promise<ReviewDto> {
    const createReplyDto = createReviewReplySchema.parse(body);

    // Get admin user ID if available
    let adminId: string | undefined;
    if (req.user) {
      try {
        const user = await this.usersService.upsertByTelegramData(req.user);
        adminId = user.id;
      } catch (error) {
        // Log but continue without adminId
        console.error('Failed to get admin user ID for reply:', error);
      }
    }

    return this.reviewsService.addReply(id, createReplyDto, adminId);
  }

  @Delete(':id/reply')
  @HttpCode(HttpStatus.OK)
  async deleteReply(@Param('id') id: string): Promise<ReviewDto> {
    return this.reviewsService.deleteReply(id);
  }
}

