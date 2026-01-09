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
    // Log before send: chat_id, token present (boolean), order id
    this.logger.log(`📤 Preparing to send order notification: orderId=${order.id}, chatId=${this.adminChatId}, hasToken=${!!this.botToken}, hasChatId=${!!this.adminChatId}`);

    if (!this.botToken || !this.adminChatId) {
      this.logger.warn(`⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured - hasToken=${!!this.botToken}, hasChatId=${!!this.adminChatId}, skipping order notification`);
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

      // Build message according to specification:
      // - "Новый заказ №{orderId}"
      // - Buyer: name + @username + telegramId
      // - Items list: "• title ×qty — lineTotal ₽"
      // - Total
      const message = `🆕 *Новый заказ №${order.id}*

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
      const payload = {
        chat_id: this.adminChatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      };

      this.logger.log(`📡 Sending Telegram message to chat ${this.adminChatId} for order ${order.id}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        // Log error with status code and response body (do NOT swallow)
        this.logger.error(`❌ Admin notify sent: false - Telegram API error for order ${order.id}: status=${response.status}, response=${responseText}`);
        throw new Error(`Telegram API error: ${response.status} ${responseText}`);
      }

      // Log success with details for verification
      this.logger.log(`✅ Admin notify sent: true - Order ${order.id} notification sent successfully to chat ${this.adminChatId}, status=${response.status}`);
    } catch (error) {
      // Log failure with details but don't throw - order creation should succeed
      this.logger.error(`❌ Admin notify sent: false - Failed to send order notification for order ${order.id}:`, error);
      // Re-throw to allow caller to handle if needed, but order creation should continue
    }
  }

  /**
   * Send a test notification to admin chat
   * Used for testing bot configuration
   */
  async sendTestNotification(): Promise<{ success: boolean; message?: string; error?: string }> {
    this.logger.log(`🧪 Sending test notification: chatId=${this.adminChatId}, hasToken=${!!this.botToken}, hasChatId=${!!this.adminChatId}`);

    if (!this.botToken || !this.adminChatId) {
      const error = `TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured - hasToken=${!!this.botToken}, hasChatId=${!!this.adminChatId}`;
      this.logger.error(`❌ Test notification failed: ${error}`);
      return {
        success: false,
        error,
      };
    }

    try {
      const testMessage = `🧪 *Тестовое уведомление*

Это тестовое сообщение для проверки настройки Telegram бота.

✅ Если вы видите это сообщение, значит:
- TELEGRAM_BOT_TOKEN настроен правильно
- TELEGRAM_ADMIN_CHAT_ID настроен правильно
- Бот может отправлять сообщения администратору

Время отправки: ${new Date().toLocaleString('ru-RU')}`;

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.adminChatId,
          text: testMessage,
          parse_mode: 'Markdown',
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        this.logger.error(`❌ Test notification failed: status=${response.status}, response=${responseText}`);
        return {
          success: false,
          error: `Telegram API error: ${response.status} ${responseText}`,
        };
      }

      this.logger.log(`✅ Test notification sent successfully: status=${response.status}`);
      return {
        success: true,
        message: `Test notification sent successfully to chat ${this.adminChatId}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Test notification failed with exception:`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price);
  }
}

