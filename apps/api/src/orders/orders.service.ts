import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderQueryDto } from './dto/order-query.dto';
import type { OrderDto, OrdersListResponse } from './dto/order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TelegramBotService } from './telegram-bot.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async create(userId: string | null, createOrderDto: CreateOrderDto): Promise<OrderDto> {
    const { items, customerName, customerPhone, customerAddress, comment, channel = 'AS' } = createOrderDto;

    // Atomic stock decrement and order creation within a single transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Validate products, calculate total, and prepare order items
      let totalAmount = 0;
      const orderItemsData = [];
      const productUpdates: Array<{ id: string; stock: number; title: string }> = [];

      // First pass: validate and prepare
      for (const item of items) {
        // Lock product row for update to prevent race conditions
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with id ${item.productId} not found`);
        }

        if (product.status !== 'ACTIVE') {
          throw new BadRequestException(`Product ${product.title} is not available for ordering`);
        }

        if (product.stock < item.qty) {
          throw new BadRequestException(
            `Not enough stock for product ${product.title}. Available: ${product.stock}, requested: ${item.qty}`,
          );
        }

        const itemTotal = product.price * item.qty;
        totalAmount += itemTotal;

        const newStock = product.stock - item.qty;
        productUpdates.push({
          id: product.id,
          stock: newStock,
          title: product.title,
        });

        orderItemsData.push({
          productId: product.id,
          titleSnapshot: product.title,
          priceSnapshot: product.price,
          qty: item.qty,
        });
      }

      // Second pass: atomically decrement stock for all products
      for (const update of productUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: {
            stock: update.stock,
            // Note: We don't change status here. Products with stock = 0 are excluded from catalog via stock > 0 filter
          },
        });
      }

      // Generate order number atomically
      const counter = await tx.orderCounter.upsert({
        where: { channel },
        update: {
          value: { increment: 1 },
        },
        create: {
          channel,
          value: 1,
        },
      });

      const seq = counter.value;
      const number = `№${seq.toString().padStart(5, '0')}/${channel}`;

      // Create order with items
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: 'NEW',
          channel,
          seq,
          number,
          totalAmount,
          currency: 'RUB',
          customerName,
          customerPhone,
          customerAddress: customerAddress || null,
          comment: comment || null,
          paymentMethod: 'MANAGER',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          user: true,
        },
      });

      return createdOrder;
    });

    return this.mapToDto(order);
  }

  async findAll(query: OrderQueryDto): Promise<OrdersListResponse> {
    const { page, pageSize, status, search } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: true,
      },
    });

    const items = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      status: order.status as 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
      channel: order.channel as 'AS' | 'LAB',
      seq: order.seq,
      number: order.number,
      totalAmount: order.totalAmount,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findByUserId(userId: string, query: { page: number; pageSize: number }): Promise<OrdersListResponse> {
    const { page, pageSize } = query;

    const where = {
      userId,
    };

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: true,
      },
    });

    const items = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      status: order.status as 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
      channel: order.channel as 'AS' | 'LAB',
      seq: order.seq,
      number: order.number,
      totalAmount: order.totalAmount,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return this.mapToDto(order);
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true, // Include user to get telegramId
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateDto.status,
      },
      include: {
        items: true,
        user: true,
      },
    });

    // Send notification to buyer if order has a user with telegramId
    if (updated.userId && updated.user?.telegramId) {
      try {
        const orderNumber = updated.number || updated.id.slice(0, 8);
        await this.telegramBotService.notifyBuyerStatusChange(
          orderNumber,
          updated.user.telegramId,
          updateDto.status,
        );
      } catch (error) {
        // Log error but don't fail the status update
        console.error('Failed to send status change notification:', error);
      }
    }

    return this.mapToDto(updated);
  }

  private mapToDto(order: any): OrderDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status as 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
      channel: order.channel as 'AS' | 'LAB',
      seq: order.seq,
      number: order.number,
      totalAmount: order.totalAmount,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      comment: order.comment,
      paymentMethod: order.paymentMethod as 'MANAGER',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        titleSnapshot: item.titleSnapshot,
        priceSnapshot: item.priceSnapshot,
        qty: item.qty,
      })),
    };
  }
}
