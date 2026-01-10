import { Controller, Post, Param, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SubscriptionsService } from './subscriptions.service';
import { TelegramBotService } from '../orders/telegram-bot.service';
import { format } from 'date-fns';

/**
 * Controller for bot-initiated subscription operations
 * This endpoint is called by the Telegram bot when handling callback_query
 * It uses bot token authentication instead of user authentication
 */
@Controller('telegram/subscriptions')
export class SubscriptionsBotController {
  private readonly botToken: string;

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly telegramBotService: TelegramBotService,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Update subscription payment date (called by bot on button click)
   * Secured by bot token in X-Bot-Token header
   */
  @Post(':id/update-payment-date')
  async updatePaymentDate(
    @Param('id') id: string,
    @Headers('x-bot-token') botToken: string,
  ): Promise<{ success: boolean; subscription?: { id: string; name: string; nextDueAt: string }; error?: string }> {
    // Verify bot token
    if (!botToken || botToken !== this.botToken) {
      throw new UnauthorizedException('Invalid or missing bot token');
    }

    try {
      // Update subscription payment date
      const updated = await this.subscriptionsService.updatePaymentDate(id);

      // Format new due date
      const newDueDate = new Date(updated.nextDueAt);
      const newDueDateFormatted = format(newDueDate, 'dd.MM.yyyy');

      // Send confirmation to admin DM and chat
      await this.telegramBotService
        .sendSubscriptionUpdateConfirmation(updated.name, newDueDateFormatted)
        .catch((error) => {
          // Log but don't fail the request
          console.error('Failed to send subscription update confirmation:', error);
        });

      return {
        success: true,
        subscription: {
          id: updated.id,
          name: updated.name,
          nextDueAt: updated.nextDueAt,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

