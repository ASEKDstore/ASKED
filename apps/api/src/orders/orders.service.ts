import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderQueryDto } from './dto/order-query.dto';
import type { OrderDto, OrdersListResponse } from './dto/order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderDto> {
    const { items, customerName, customerPhone, customerAddress, comment } = createOrderDto;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
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

      orderItemsData.push({
        productId: product.id,
        titleSnapshot: product.title,
        priceSnapshot: product.price,
        qty: item.qty,
      });
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'NEW',
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
      },
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
      },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(order: any): OrderDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status as 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
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
