import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

interface TelegramUpdate {
  update_id: number;
  channel_post?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    date: number;
    text?: string;
    views?: number;
    forwards?: number;
  };
}

@Injectable()
export class TelegramWebhookService {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    // Only process channel_post updates
    if (!update.channel_post) {
      return;
    }

    const channelId = this.configService.get<string>('TELEGRAM_CHANNEL_ID', '');
    const post = update.channel_post;

    // Verify channel ID matches configured channel
    const channelIdStr = post.chat.id.toString();
    const channelUsername = post.chat.username;

    const isChannelMatch =
      channelId === channelIdStr ||
      channelId === `@${channelUsername}` ||
      channelId === channelUsername;

    if (!isChannelMatch) {
      this.logger.debug(`Ignoring post from channel ${channelIdStr} (not configured channel)`);
      return;
    }

    // Extract text excerpt (first 500 chars)
    const text = post.text || '';
    const textExcerpt = text.length > 500 ? text.substring(0, 500) : text || null;

    // Generate link
    const username = post.chat.username || channelIdStr;
    const link = `https://t.me/${username.replace('@', '')}/${post.message_id}`;

    // Upsert post
    await this.prisma.telegramPost.upsert({
      where: {
        channelId_messageId: {
          channelId: channelIdStr,
          messageId: post.message_id,
        },
      },
      update: {
        views: post.views || 0,
        forwards: post.forwards || 0,
        text: text || null,
        textExcerpt,
        updatedAt: new Date(),
      },
      create: {
        channelId: channelIdStr,
        messageId: post.message_id,
        date: new Date(post.date * 1000),
        text: text || null,
        textExcerpt,
        views: post.views || 0,
        forwards: post.forwards || 0,
        link,
      },
    });

    this.logger.log(`Processed channel post ${post.message_id} from channel ${channelIdStr}`);
  }
}




