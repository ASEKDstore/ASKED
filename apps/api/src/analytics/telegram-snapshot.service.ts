import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

type TelegramApiResponse<T> =
  | { ok: true; result: T }
  | { ok: false; description?: string; error_code?: number };

@Injectable()
export class TelegramSnapshotService {
  private readonly logger = new Logger(TelegramSnapshotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // Run every hour at minute 0
  @Cron(CronExpression.EVERY_HOUR)
  async takeSnapshot(): Promise<void> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID');

    if (!botToken || !channelId) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not configured, skipping snapshot',
      );
      return;
    }

    try {
      // Call Telegram Bot API getChatMemberCount
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as TelegramApiResponse<never>;
        this.logger.error(`Failed to get chat member count: ${JSON.stringify(error)}`);
        return;
      }

      const data = (await response.json()) as TelegramApiResponse<number>;
      const subscriberCount = data.ok ? data.result : 0;

      // Store snapshot with idempotency (one per hour)
      const now = new Date();
      const snapshotAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        0,
        0,
        0,
      );

      await this.prisma.telegramChannelSnapshot.upsert({
        where: {
          channelId_snapshotAt: {
            channelId,
            snapshotAt,
          },
        },
        update: {
          subscriberCount,
        },
        create: {
          channelId,
          subscriberCount,
          snapshotAt,
        },
      });

      this.logger.log(
        `Snapshot stored: ${subscriberCount} subscribers for channel ${channelId} at ${snapshotAt.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Error taking snapshot: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
