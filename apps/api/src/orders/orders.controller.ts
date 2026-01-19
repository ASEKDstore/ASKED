import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';

import { AppEventsService } from '../analytics/app-events.service';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import type { AuthenticatedRequest } from '../auth/telegram-auth.guard';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { UsersService } from '../users/users.service';

import { createLabOrderSchema } from './dto/create-lab-order.dto';
import { createOrderSchema } from './dto/create-order.dto';
import type { OrderDto, OrdersListResponse } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { TelegramBotService } from './telegram-bot.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly telegramBotService: TelegramBotService,
    private readonly appEventsService: AppEventsService,
  ) {}

  @Post()
  @UseGuards(TelegramAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request & AuthenticatedRequest, @Body() body: any): Promise<OrderDto> {
    const createOrderDto = createOrderSchema.parse(body);

    // User is authenticated via TelegramAuthGuard
    // req.user and req.telegramUser are both available
    const telegramUser = req.user;

    if (!telegramUser) {
      throw new Error('User not authenticated');
    }

    // Upsert user in database
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    const userId = user.id;

    // Prepare user data for notification
    const userData = {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      telegramId: telegramUser.id.toString(),
    };

    // Create order in DB
    // The service will:
    // - Link order to userId (telegramId)
    // - Store snapshot of items (title, price, qty)
    // - Set status = NEW
    const order = await this.ordersService.create(userId, createOrderDto);

    // Track PURCHASE event for analytics (fire and forget - don't fail order creation if this fails)
    void this.appEventsService
      .createEvent({
        eventType: 'PURCHASE',
        userId: telegramUser.id.toString(),
        source: 'telegram',
      })
      .catch((error) => {
        console.error('Failed to track purchase event:', error);
      });

    // Send Telegram notification to admin (fire and forget - don't fail order creation if it fails)
    void this.telegramBotService.notifyNewOrder(order, userData).catch((error) => {
      // Log but don't fail the request
      console.error('Failed to send order notification:', error);
    });

    // Log order creation success
    console.log(`Order ${order.id} created successfully for user ${telegramUser.id}`);

    // Return 201 with order id
    return order;
  }

  @Post('lab')
  @UseGuards(TelegramAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createLabOrder(
    @Req() req: Request & AuthenticatedRequest,
    @Body() body: any,
  ): Promise<OrderDto> {
    const createLabOrderDto = createLabOrderSchema.parse(body);

    const telegramUser = req.user;
    if (!telegramUser) {
      throw new Error('User not authenticated');
    }

    // Upsert user
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    const userId = user.id;

    // Prepare user data for notification
    const userData = {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      telegramId: telegramUser.id.toString(),
    };

    // Create LAB order
    const order = await this.ordersService.createLabOrder(userId, createLabOrderDto);

    // Send LAB-specific notification
    void this.telegramBotService
      .notifyNewLabOrder(
        order,
        {
          clothingType: createLabOrderDto.clothingType,
          size: createLabOrderDto.size,
          colorChoice: createLabOrderDto.colorChoice,
          customColor: createLabOrderDto.customColor,
          placement: createLabOrderDto.placement,
          description: createLabOrderDto.description,
          attachmentUrl: createLabOrderDto.attachmentUrl || null,
        },
        userData,
      )
      .catch((error) => {
        console.error('Failed to send LAB order notification:', error);
      });

    return order;
  }

  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyOrders(@Req() req: Request & { user: TelegramUser }): Promise<OrdersListResponse> {
    // User is authenticated via TelegramAuthGuard, so req.user exists
    const user = await this.usersService.upsertByTelegramData(req.user);

    return this.ordersService.findByUserId(user.id, {
      page: 1,
      pageSize: 50,
    });
  }

  @Get('my/last')
  @UseGuards(TelegramAuthGuard)
  async getMyLastOrder(@Req() req: Request & { user: TelegramUser }): Promise<OrderDto | null> {
    // User is authenticated via TelegramAuthGuard, so req.user exists
    const user = await this.usersService.upsertByTelegramData(req.user);

    return this.ordersService.findLastByUserId(user.id);
  }

  @Get('my/:id')
  @UseGuards(TelegramAuthGuard)
  async getMyOrder(
    @Req() req: Request & { user: TelegramUser },
    @Param('id') id: string,
  ): Promise<OrderDto> {
    // User is authenticated via TelegramAuthGuard, so req.user exists
    const user = await this.usersService.upsertByTelegramData(req.user);

    // Find order by ID and userId (ensures user can only access their own orders)
    return this.ordersService.findOneByUserId(user.id, id);
  }
}
