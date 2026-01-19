import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { format } from 'date-fns';

import { TelegramBotService } from '../orders/telegram-bot.service';

import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsScheduler {
  private readonly logger = new Logger(SubscriptionsScheduler.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  /**
   * Run daily at 09:00 server time to check for subscriptions needing reminders
   * Cron: 0 9 * * * (every day at 09:00)
   */
  @Cron('0 9 * * *')
  async checkSubscriptionsReminders(): Promise<void> {
    this.logger.log('🕐 Starting daily subscription reminders check...');

    try {
      const subscriptions = await this.subscriptionsService.findSubscriptionsNeedingReminders();

      this.logger.log(`Found ${subscriptions.length} subscriptions needing reminders`);

      for (const subscription of subscriptions) {
        try {
          const nextDueDate = new Date(subscription.nextDueAt);
          const dueDateFormatted = format(nextDueDate, 'dd.MM.yyyy');

          const daysRemaining = Math.ceil(
            (nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          // Send notification to admin DM and chat with inline button
          await this.telegramBotService
            .sendSubscriptionReminder(
              subscription.id,
              subscription.name,
              dueDateFormatted,
              daysRemaining,
            )
            .catch((error) => {
              this.logger.error(
                `❌ Failed to send reminder notification for subscription ${subscription.id}:`,
                error,
              );
            });

          // Mark as reminded
          await this.subscriptionsService.markAsReminded(subscription.id, nextDueDate);

          this.logger.log(
            `✅ Sent reminder for subscription ${subscription.id} (${subscription.name})`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Failed to send reminder for subscription ${subscription.id}:`,
            error,
          );
          // Continue with other subscriptions
        }
      }

      this.logger.log(
        `✅ Completed subscription reminders check. Processed ${subscriptions.length} subscriptions.`,
      );
    } catch (error) {
      this.logger.error('❌ Error during subscription reminders check:', error);
    }
  }
}
