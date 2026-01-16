import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FifoAllocationService } from '../warehouse/fifo-allocation.service';

import type { CreateOrderDto } from './dto/create-order.dto';
import type { CreateLabOrderDto } from './dto/create-lab-order.dto';
import type { OrderQueryDto } from './dto/order-query.dto';
import type { OrderDto, OrdersListResponse } from './dto/order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TelegramBotService } from './telegram-bot.service';

@Injectable()
export class OrdersService {
  private readonly fifoAllocationService: FifoAllocationService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.fifoAllocationService = new FifoAllocationService();
  }

  async create(userId: string | null, createOrderDto: CreateOrderDto): Promise<OrderDto> {
    const { items, customerName, customerPhone, customerAddress, comment, channel = 'AS', idempotencyKey } = createOrderDto;

    // Check idempotency: if idempotencyKey provided and order exists, return existing order
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          user: true,
        },
      });

      if (existingOrder) {
        // Return existing order without consuming lots again
        return this.mapToDto(existingOrder);
      }
    }

    // Atomic FIFO allocation and order creation within a single transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Validate products, calculate total, and check stock
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        titleSnapshot: string;
        priceSnapshot: number;
        salePriceAtTime: number;
        costPriceAtTime: number | null;
        packagingCostAtTime: number | null;
        qty: number;
        cogsTotal: number;
      }> = [];

      // First pass: validate products and check stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with id ${item.productId} not found`);
        }

        if (product.status !== 'ACTIVE') {
          throw new BadRequestException(`Product ${product.title} is not available for ordering`);
        }

        // Check stock using InventoryMovement sum (FIFO-based)
        const currentStock = await tx.inventoryMovement.aggregate({
          where: { productId: item.productId },
          _sum: { quantity: true },
        });

        const availableStock = currentStock._sum.quantity ?? 0;
        if (availableStock < item.qty) {
          throw new ConflictException({
            code: 'OUT_OF_STOCK',
            message: 'Товара нет в наличии',
            productId: product.id,
            productTitle: product.title,
            available: availableStock,
            requested: item.qty,
          });
        }

        const itemTotal = product.price * item.qty;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          titleSnapshot: product.title,
          priceSnapshot: product.price,
          salePriceAtTime: product.price,
          costPriceAtTime: product.costPrice ?? null,
          packagingCostAtTime: product.packagingCost ?? null,
          qty: item.qty,
          cogsTotal: 0, // Will be calculated during FIFO allocation
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

      // Create order with items (without cogsTotal first, will update after FIFO allocation)
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: 'NEW',
          channel,
          seq,
          number,
          idempotencyKey: idempotencyKey || null,
          totalAmount,
          currency: 'RUB',
          customerName,
          customerPhone,
          customerAddress: customerAddress || null,
          comment: comment || null,
          paymentMethod: 'MANAGER',
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              titleSnapshot: item.titleSnapshot,
              priceSnapshot: item.priceSnapshot,
              salePriceAtTime: item.salePriceAtTime,
              costPriceAtTime: item.costPriceAtTime,
              packagingCostAtTime: item.packagingCostAtTime,
              qty: item.qty,
              cogsTotal: null, // Will be set after FIFO allocation
            })),
          },
        },
        include: {
          items: true,
          user: true,
        },
      });

      // Second pass: FIFO allocation for each order item
      for (let i = 0; i < createdOrder.items.length; i++) {
        const orderItem = createdOrder.items[i];
        const requestedQty = orderItemsData[i].qty;

        // Use FIFO allocation service
        const allocationResult = await this.fifoAllocationService.allocateLots(
          tx,
          orderItem.productId,
          requestedQty,
          orderItem.id,
          null, // No write-off ID for orders
        );

        const totalCogs = allocationResult.totalCogs;

        // Update order item with calculated COGS
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            cogsTotal: totalCogs,
            profitTotal:
              orderItem.salePriceAtTime * orderItem.qty -
              totalCogs -
              (orderItem.packagingCostAtTime ?? 0) * orderItem.qty,
          },
        });

        // Update orderItemsData for later use
        orderItemsData[i].cogsTotal = totalCogs;
      }

      // Create inventory movements (OUT) for each order item
      for (const itemData of orderItemsData) {
        await tx.inventoryMovement.create({
          data: {
            productId: itemData.productId,
            quantity: -itemData.qty, // Negative for OUT
            type: 'OUT',
            sourceType: 'ORDER',
            sourceId: createdOrder.id,
          },
        });
      }

      // Reload order with updated items
      const updatedOrder = await tx.order.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: true,
          user: true,
        },
      });

      if (!updatedOrder) {
        throw new Error('Order not found after creation');
      }

      return updatedOrder;
    });

    const orderDto = this.mapToDto(order);

    // Create ORDER_CREATED notification (fire and forget - don't fail order creation if this fails)
    if (userId && orderDto.number) {
      void this.notificationsService
        .createOrderNotification('ORDER_CREATED', userId, orderDto.id, orderDto.number)
        .catch((error) => {
          console.error('Failed to create order notification:', error);
        });
    }

    return orderDto;
  }

  async findAll(query: OrderQueryDto): Promise<OrdersListResponse> {
    const { page, pageSize, status, search, includeDeleted = false } = query;

    const where: any = {};

    // Filter out deleted orders by default (unless includeDeleted=true)
    if (!includeDeleted) {
      where.deletedAt = null;
    }

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
      deletedAt: null, // Always exclude deleted orders for users
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

  async findLastByUserId(userId: string): Promise<OrderDto | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        deletedAt: null, // Only non-deleted orders
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    if (!order) {
      return null;
    }

    return this.mapToDto(order);
  }

  async findOneByUserId(userId: string, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // Only non-deleted orders
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return this.mapToDto(order);
  }

  async findOne(id: string, includeDeleted = false): Promise<OrderDto> {
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const order = await this.prisma.order.findFirst({
      where,
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
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null, // Cannot update deleted orders
      },
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

    // Create ORDER_STATUS_CHANGED notification (fire and forget)
    if (updated.userId && updated.number) {
      const statusMessages: Record<string, string> = {
        NEW: 'новый',
        CONFIRMED: 'подтверждён',
        IN_PROGRESS: 'в обработке',
        DONE: 'выполнен',
        CANCELED: 'отменён',
      };

      const statusText = statusMessages[updateDto.status] || 'изменён';

      void this.notificationsService
        .createOrderNotification('ORDER_STATUS_CHANGED', updated.userId, updated.id, updated.number, statusText)
        .catch((error) => {
          console.error('Failed to create order status notification:', error);
        });
    }

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

  async softDelete(id: string, deletedBy?: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null, // Cannot delete already deleted orders
      },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found or already deleted`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
      include: {
        items: true,
        user: true,
      },
    });

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
        salePriceAtTime: item.salePriceAtTime,
        costPriceAtTime: item.costPriceAtTime,
        packagingCostAtTime: item.packagingCostAtTime,
        qty: item.qty,
        cogsTotal: item.cogsTotal ?? null,
      })),
    };
  }

  async createLabOrder(userId: string | null, createLabOrderDto: CreateLabOrderDto): Promise<OrderDto> {
    const {
      clothingType,
      size,
      colorChoice,
      customColor,
      placement,
      description,
      attachmentUrl,
      customerName,
      customerPhone,
      idempotencyKey,
    } = createLabOrderDto;

    // Check idempotency
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          user: true,
        },
      });

      if (existingOrder) {
        return this.mapToDto(existingOrder);
      }
    }

    // Create LAB order with wizard data in comment
    const wizardData = {
      clothingType: clothingType || 'hoodie',
      size: size || null,
      colorChoice: colorChoice || null,
      customColor: customColor || null,
      placement: placement || null,
      description,
      attachmentUrl: attachmentUrl || null,
    };

    // Format comment with wizard data
    const commentLines = [
      '=== LAB ЗАКАЗ ===',
      `Что кастомим: ${wizardData.clothingType === 'custom' ? 'Своё' : 'Худи'}`,
      wizardData.size ? `Размер: ${wizardData.size}` : null,
      wizardData.colorChoice
        ? `Цвет: ${wizardData.colorChoice === 'black' ? 'Черный' : wizardData.colorChoice === 'white' ? 'Белый' : 'Серый'}`
        : null,
      wizardData.placement
        ? `Место: ${
            wizardData.placement === 'front'
              ? 'Фронт'
              : wizardData.placement === 'back'
                ? 'Спина'
                : wizardData.placement === 'sleeve'
                  ? 'Рукав'
                  : 'Индивидуально'
          }`
        : null,
      `Идея клиента: ${wizardData.description}`,
      wizardData.attachmentUrl ? `Медиа: ${wizardData.attachmentUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    // Create order with channel=LAB
    const order = await this.prisma.$transaction(async (tx) => {
      // Get or create order counter for LAB channel
      const counter = await tx.orderCounter.upsert({
        where: { channel: 'LAB' },
        update: { value: { increment: 1 } },
        create: { channel: 'LAB', value: 1 },
      });

      const seq = counter.value;
      const number = `№${String(seq).padStart(5, '0')}/LAB`;

      // Create order with LAB channel
      const createdOrder = await tx.order.create({
        data: {
          userId: userId || null,
          status: 'NEW',
          channel: 'LAB',
          seq,
          number,
          idempotencyKey: idempotencyKey || null,
          totalAmount: 0, // LAB orders have no items, total is 0
          currency: 'RUB',
          customerName: customerName || 'Не указано',
          customerPhone: customerPhone || 'Не указано',
          comment: commentLines,
        },
      });

      return createdOrder;
    });

    // Reload order
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        user: true,
      },
    });

    if (!fullOrder) {
      throw new Error('Order not found after creation');
    }

    const orderDto = this.mapToDto(fullOrder);

    // Create ORDER_CREATED notification
    if (userId && orderDto.number) {
      void this.notificationsService
        .createOrderNotification('ORDER_CREATED', userId, orderDto.id, orderDto.number)
        .catch((error) => {
          console.error('Failed to create order notification:', error);
        });
    }

    return orderDto;
  }
}
