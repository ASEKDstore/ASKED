import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { AdminPromosService } from './admin-promos.service';
import type { PromoDto } from './dto/promo.dto';
import { createPromoSchema, updatePromoSchema } from './dto/promo.dto';

@Controller('admin/promos')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminPromosController {
  constructor(private readonly adminPromosService: AdminPromosService) {}

  @Get()
  async findAll(): Promise<PromoDto[]> {
    return this.adminPromosService.findAll();
  }

  @Post()
  async create(@Body() body: any): Promise<PromoDto> {
    const createDto = createPromoSchema.parse(body);
    return this.adminPromosService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PromoDto> {
    return this.adminPromosService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any): Promise<PromoDto> {
    const updateDto = updatePromoSchema.parse(body);
    return this.adminPromosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminPromosService.delete(id);
  }
}



