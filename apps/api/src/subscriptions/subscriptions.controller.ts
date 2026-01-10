import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { createSubscriptionSchema } from './dto/create-subscription.dto';
import type { SubscriptionDto } from './dto/subscription.dto';
import { updateSubscriptionSchema } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(@Body() body: unknown): Promise<SubscriptionDto> {
    const createDto = createSubscriptionSchema.parse(body);
    return this.subscriptionsService.create(createDto);
  }

  @Get()
  async findAll(): Promise<SubscriptionDto[]> {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SubscriptionDto> {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<SubscriptionDto> {
    const updateDto = updateSubscriptionSchema.parse(body);
    return this.subscriptionsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<SubscriptionDto> {
    return this.subscriptionsService.remove(id);
  }
}

