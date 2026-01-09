import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { OrderDto } from './dto/order.dto';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly adminPanelUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID', '');
    this.adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL', 'http://localhost:3000/admin');
  }

  async notifyNewOrder(order: OrderDto, buyerInfo?: { username?: string; firstName?: string; lastName?: string; telegramId?: string }): Promise<void> {
    if (!this.botToken || !this.adminChatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured, skipping order notification');
      return;
    }

    try {
      const buyerName = buyerInfo?.firstName && buyerInfo?.lastName
        ? `${buyerInfo.firstName} ${buyerInfo.lastName}`
        : buyerInfo?.firstName || buyerInfo?.username || 'Не указано';
      
      const buyerUsername = buyerInfo?.username ? `@${buyerInfo.username}` : '';
      const buyerTelegramId = buyerInfo?.telegramId ? ` (ID: ${buyerInfo.telegramId})` : '';

      // Build items list
      const itemsText = order.items
        .map(item => {
          const lineTotal = item.priceSnapshot * item.qty;
          return `• ${item.titleSnapshot} ×${item.qty} — ${this.formatPrice(lineTotal)} ₽`;
        })
        .join('\n');

      // Build message according to specification
      // Header: New order with order id
      // Buyer: name + @username + telegramId
      // Items list: • {title} ×{qty} — {lineTotal} ₽
      // Total price
      // Optional comment/delivery info
      const message = `🆕 *Новый заказ*

📦 *Заказ №${order.id}*

👤 *Покупатель:*
${buyerName}${buyerUsername ? ` ${buyerUsername}` : ''}${buyerTelegramId}
📞 ${order.customerPhone}
${order.customerAddress ? `📍 *Адрес:* ${order.customerAddress}` : ''}

🛍️ *Товары:*
${itemsText}

💰 *Итого: ${this.formatPrice(order.totalAmount)} ₽*
${order.comment ? `\n💬 *Комментарий:*\n${order.comment}` : ''}`;

      // Build inline keyboard as specified:
      // "Открыть заказ" → {ADMIN_PANEL_URL}/orders/{orderId}
      // "Открыть админку" → {ADMIN_PANEL_URL}
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: 'Открыть заказ',
              url: `${this.adminPanelUrl}/orders/${order.id}`,
            },
          ],
          [
            {
              text: 'Открыть админку',
              url: this.adminPanelUrl,
            },
          ],
        ],
      };

      // Send message via Telegram Bot API
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.adminChatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${response.status} ${errorText}`);
      }

      this.logger.log(`Order notification sent for order ${order.id}`);
    } catch (error) {
      // Don't throw - just log the error so it doesn't break order creation
      this.logger.error(`Failed to send order notification for order ${order.id}:`, error);
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price);
  }
}

