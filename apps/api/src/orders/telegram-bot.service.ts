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
    // ADMIN_PANEL_URL should be the base URL (e.g., http://localhost:3000 or https://example.com)
    // We'll append /admin for the admin routes
    this.adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL', 'http://localhost:3000');
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
      // "Открыть заказ" → {ADMIN_PANEL_URL}/admin/orders/{orderId}
      // "Открыть админку" → {ADMIN_PANEL_URL}/admin
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: 'Открыть заказ',
              url: `${this.adminPanelUrl}/admin/orders/${order.id}`,
            },
          ],
          [
            {
              text: 'Открыть админку',
              url: `${this.adminPanelUrl}/admin`,
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

      // Log success with details for verification
      this.logger.log(`✅ Admin notify sent: true - Order ${order.id} notification sent to chat ${this.adminChatId}`);
    } catch (error) {
      // Log failure with details but don't throw - order creation should succeed
      this.logger.error(`❌ Admin notify sent: false - Failed to send order notification for order ${order.id}:`, error);
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price);
  }
}

