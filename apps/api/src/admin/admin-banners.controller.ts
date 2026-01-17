import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { AdminBannersService } from './admin-banners.service';
import type { BannerDto } from './dto/banner.dto';
import { createBannerSchema, updateBannerSchema, bannerQuerySchema } from './dto/banner.dto';

@Controller('admin/banners')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminBannersController {
  constructor(private readonly adminBannersService: AdminBannersService) {}

  @Get()
  async findAll(@Query() query: any): Promise<{ items: BannerDto[]; total: number; page: number; pageSize: number }> {
    const validatedQuery = bannerQuerySchema.parse(query);
    return this.adminBannersService.findAll(validatedQuery);
  }

  @Post()
  async create(@Body() body: any): Promise<BannerDto> {
    const createDto = createBannerSchema.parse(body);
    return this.adminBannersService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BannerDto> {
    return this.adminBannersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any): Promise<BannerDto> {
    const updateDto = updateBannerSchema.parse(body);
    return this.adminBannersService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminBannersService.delete(id);
  }
}










