import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { orderQuerySchema } from '../orders/dto/order-query.dto';
import { updateOrderStatusSchema } from '../orders/dto/update-order-status.dto';
import type {
  OrderDto,
  OrdersListResponse,
} from '../orders/dto/order.dto';

@Controller('admin/orders')
@UseGuards(TelegramAuthGuard, AdminGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query() query: any): Promise<OrdersListResponse> {
    const validatedQuery = orderQuerySchema.parse(query);
    return this.ordersService.findAll(validatedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderDto> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<OrderDto> {
    const updateDto = updateOrderStatusSchema.parse(body);
    return this.ordersService.updateStatus(id, updateDto);
  }
}

