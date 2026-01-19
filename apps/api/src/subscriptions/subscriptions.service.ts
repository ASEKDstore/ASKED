import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { addMonths } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { SubscriptionDto } from './dto/subscription.dto';
import type { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate nextDueAt based on lastPaidAt and periodMonths
   */
  private calculateNextDueAt(lastPaidAt: Date, periodMonths: number): Date {
    return addMonths(lastPaidAt, periodMonths);
  }

  async create(createDto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    const lastPaidAt = new Date(createDto.lastPaidAt);
    const nextDueAt = this.calculateNextDueAt(lastPaidAt, createDto.periodMonths);

    const subscription = await this.prisma.subscription.create({
      data: {
        name: createDto.name,
        provider: createDto.provider || null,
        lastPaidAt,
        periodMonths: createDto.periodMonths,
        remindBeforeDays: createDto.remindBeforeDays,
        nextDueAt,
        isActive: createDto.isActive,
      },
    });

    return this.mapToDto(subscription);
  }

  async findAll(): Promise<SubscriptionDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((s) => this.mapToDto(s));
  }

  async findOne(id: string): Promise<SubscriptionDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    return this.mapToDto(subscription);
  }

  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionDto> {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const updateData: {
      name?: string;
      provider?: string | null;
      lastPaidAt?: Date;
      periodMonths?: number;
      remindBeforeDays?: number;
      nextDueAt?: Date;
      isActive?: boolean;
    } = {};

    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }

    if (updateDto.provider !== undefined) {
      updateData.provider = updateDto.provider;
    }

    if (updateDto.lastPaidAt !== undefined) {
      const lastPaidAt = new Date(updateDto.lastPaidAt);
      updateData.lastPaidAt = lastPaidAt;

      // Recalculate nextDueAt if lastPaidAt or periodMonths changed
      const periodMonths = updateDto.periodMonths ?? existing.periodMonths;
      updateData.nextDueAt = this.calculateNextDueAt(lastPaidAt, periodMonths);
    } else if (updateDto.periodMonths !== undefined) {
      // Only periodMonths changed, recalculate from existing lastPaidAt
      updateData.periodMonths = updateDto.periodMonths;
      updateData.nextDueAt = this.calculateNextDueAt(existing.lastPaidAt, updateDto.periodMonths);
    }

    if (updateDto.remindBeforeDays !== undefined) {
      updateData.remindBeforeDays = updateDto.remindBeforeDays;
    }

    if (updateDto.isActive !== undefined) {
      updateData.isActive = updateDto.isActive;
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<SubscriptionDto> {
    // Soft delete by setting isActive = false
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { isActive: false },
    });

    return this.mapToDto(subscription);
  }

  /**
   * Find subscriptions that need reminders
   * Criteria:
   * - isActive = true
   * - now is within [nextDueAt - remindBeforeDays days, nextDueAt)
   * - lastRemindedForDueAt !== nextDueAt (not already reminded for this due date)
   */
  async findSubscriptionsNeedingReminders(): Promise<Array<SubscriptionDto>> {
    const now = new Date();

    // Find all active subscriptions with nextDueAt in the near future (next 30 days to be safe)
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        nextDueAt: {
          // Get subscriptions where nextDueAt is in the past or near future
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    });

    // Filter in application code to check remindBeforeDays and lastRemindedForDueAt
    const needingReminders: Array<SubscriptionDto> = [];

    for (const sub of subscriptions) {
      // Calculate the reminder date (nextDueAt - remindBeforeDays days)
      const remindDate = new Date(sub.nextDueAt);
      remindDate.setDate(remindDate.getDate() - sub.remindBeforeDays);
      remindDate.setHours(0, 0, 0, 0); // Start of day

      const nowStartOfDay = new Date(now);
      nowStartOfDay.setHours(0, 0, 0, 0);

      // Check if we're within the reminder window: [remindDate, nextDueAt)
      // We send reminder on the day when remindDate is reached
      if (nowStartOfDay >= remindDate && now < sub.nextDueAt) {
        // Check if we've already reminded for this due date
        // Compare by date only (ignore time)
        const lastRemindedDate = sub.lastRemindedForDueAt
          ? new Date(sub.lastRemindedForDueAt)
          : null;
        const nextDueDate = new Date(sub.nextDueAt);

        if (!lastRemindedDate || lastRemindedDate.getTime() !== nextDueDate.getTime()) {
          needingReminders.push(this.mapToDto(sub));
        }
      }
    }

    return needingReminders;
  }

  /**
   * Mark subscription as reminded for a specific due date
   */
  async markAsReminded(id: string, dueAt: Date): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data: {
        lastRemindedAt: new Date(),
        lastRemindedForDueAt: dueAt,
      },
    });
  }

  /**
   * Update subscription payment date (set lastPaidAt to now)
   * Recalculates nextDueAt and resets reminder flags
   */
  async updatePaymentDate(id: string): Promise<SubscriptionDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    if (!subscription.isActive) {
      throw new BadRequestException(`Subscription ${id} is not active`);
    }

    const now = new Date();
    const nextDueAt = this.calculateNextDueAt(now, subscription.periodMonths);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        lastPaidAt: now,
        nextDueAt,
        lastRemindedAt: null,
        lastRemindedForDueAt: null,
      },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(subscription: {
    id: string;
    name: string;
    provider: string | null;
    lastPaidAt: Date;
    periodMonths: number;
    remindBeforeDays: number;
    nextDueAt: Date;
    lastRemindedAt: Date | null;
    lastRemindedForDueAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionDto {
    return {
      id: subscription.id,
      name: subscription.name,
      provider: subscription.provider,
      lastPaidAt: subscription.lastPaidAt.toISOString(),
      periodMonths: subscription.periodMonths,
      remindBeforeDays: subscription.remindBeforeDays,
      nextDueAt: subscription.nextDueAt.toISOString(),
      lastRemindedAt: subscription.lastRemindedAt?.toISOString() ?? null,
      lastRemindedForDueAt: subscription.lastRemindedForDueAt?.toISOString() ?? null,
      isActive: subscription.isActive,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}
