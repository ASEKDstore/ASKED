import { Controller, Get, Param, Patch, Delete, Body, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { orderQuerySchema } from '../orders/dto/order-query.dto';
import type { OrderDto, OrdersListResponse } from '../orders/dto/order.dto';
import { updateOrderStatusSchema } from '../orders/dto/update-order-status.dto';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';

@Controller('admin/orders')
// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(@Query() query: any): Promise<OrdersListResponse> {
    const validatedQuery = orderQuerySchema.parse(query);
    return this.ordersService.findAll(validatedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string): Promise<OrderDto> {
    const includeDeletedBool = includeDeleted === 'true';
    return this.ordersService.findOne(id, includeDeletedBool);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any): Promise<OrderDto> {
    const updateDto = updateOrderStatusSchema.parse(body);
    return this.ordersService.updateStatus(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: Request & { user?: TelegramUser }): Promise<OrderDto> {
    // Get admin user ID for deletedBy tracking
    let deletedBy: string | undefined;
    if (req.user) {
      try {
        const user = await this.usersService.upsertByTelegramData(req.user);
        deletedBy = user.id;
      } catch (error) {
        // Log but continue without deletedBy
        console.error('Failed to get admin user ID for soft delete:', error);
      }
    }

    return this.ordersService.softDelete(id, deletedBy);
  }
}
