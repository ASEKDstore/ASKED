import { Controller, Get, Param, Post, Body, Query, UseGuards, Req } from '@nestjs/common';

import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { AuthenticatedRequest } from '../auth/telegram-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

import type { LabWorkDto, RateLabWorkResponse } from './dto/lab-work.dto';
import { rateLabWorkSchema } from './dto/lab-work.dto';
import type { PublicLabProductDto } from './dto/public-lab-product.dto';
import { LabService } from './lab.service';

@Controller('public/lab-products')
export class PublicLabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(): Promise<PublicLabProductDto[]> {
    return this.labService.findAllPublic();
  }
}

@Controller('lab/works')
export class PublicLabWorksController {
  constructor(
    private readonly labService: LabService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  async getStatus(): Promise<{ maintenance: boolean }> {
    return this.labService.getLabStatus();
  }

  @Get()
  async findAll(@Query('limit') limit?: string): Promise<LabWorkDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const safeLimit =
      limitNum && !isNaN(limitNum) && limitNum > 0 && limitNum <= 100 ? limitNum : undefined;
    return this.labService.findAllPublicWorks(safeLimit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LabWorkDto> {
    return this.labService.findOneWork(id);
  }

  @Get('slug/:slug')
  async findOneBySlug(@Param('slug') slug: string): Promise<LabWorkDto> {
    return this.labService.findOneWorkBySlug(slug);
  }

  @Post(':id/rate')
  @UseGuards(TelegramAuthGuard)
  async rateWork(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<RateLabWorkResponse> {
    const rateDto = rateLabWorkSchema.parse(body);

    // Get user ID from request (upserted in guard)
    if (!req.telegramUser) {
      throw new Error('User not found in request');
    }

    // Find user by telegramId to get userId
    const user = await this.prisma.user.findUnique({
      where: { telegramId: req.telegramUser.telegramId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    return this.labService.rateLabWork(id, user.id, rateDto);
  }
}
