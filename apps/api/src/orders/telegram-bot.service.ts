import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminChatConfigService } from './admin-chat-config.service';
import type { OrderDto } from './dto/order.dto';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string;
  private readonly adminChatId: string; // Legacy: kept for backward compatibility (TELEGRAM_ADMIN_CHAT_ID)
  private readonly adminTgId: string; // ADMIN_TG_ID - for direct messages
  private readonly adminChatIdNew: string; // ADMIN_CHAT_ID - for group chat (ENV fallback)
  private readonly adminChatThreadId: number | null; // ADMIN_CHAT_THREAD_ID - optional topic/thread ID (ENV fallback)
  private readonly adminPanelUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly adminChatConfigService: AdminChatConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID', '');
    this.adminTgId = this.configService.get<string>('ADMIN_TG_ID', '');
    this.adminChatIdNew = this.configService.get<string>('ADMIN_CHAT_ID', '');
    const threadIdStr = this.configService.get<string>('ADMIN_CHAT_THREAD_ID', '');
    this.adminChatThreadId = threadIdStr ? parseInt(threadIdStr, 10) : null;
    // ADMIN_PANEL_URL should be the base URL (e.g., http://localhost:3000 or https://example.com)
    // We'll append /admin for the admin routes
    this.adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL', 'http://localhost:3000');
  }

  /**
   * Resolve admin chat configuration (DB priority, ENV fallback)
   */
  private async resolveAdminChatConfig(): Promise<{
    chatId: string | null;
    threadId: number | null;
  }> {
    try {
      // 1. Try DB config first
      const dbConfig = await this.adminChatConfigService.getConfig();
      if (dbConfig) {
        this.logger.log(
          `📋 Using admin chat config from DB: chatId=${dbConfig.chatId}, threadId=${dbConfig.threadId || 'null'}`,
        );
        return {
          chatId: dbConfig.chatId,
          threadId: dbConfig.threadId,
        };
      }

      // 2. Fallback to ENV
      if (this.adminChatIdNew) {
        this.logger.log(
          `📋 Using admin chat config from ENV: chatId=${this.adminChatIdNew}, threadId=${this.adminChatThreadId || 'null'}`,
        );
        return {
          chatId: this.adminChatIdNew,
          threadId: this.adminChatThreadId,
        };
      }

      // 3. No config available
      return {
        chatId: null,
        threadId: null,
      };
    } catch (error) {
      this.logger.error('Failed to resolve admin chat config, falling back to ENV:', error);
      // Fallback to ENV on error
      return {
        chatId: this.adminChatIdNew || null,
        threadId: this.adminChatThreadId,
      };
    }
  }

  /**
   * Send a message to a chat, optionally in a specific thread
   */
  private async sendMessage(
    chatId: string,
    text: string,
    options?: {
      parseMode?: 'Markdown' | 'HTML';
      replyMarkup?: unknown;
      messageThreadId?: number;
    },
  ): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not configured - skipping message send');
      return;
    }

    if (!chatId) {
      this.logger.warn(`⚠️ Chat ID not provided - skipping message send`);
      return;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const payload: {
      chat_id: string;
      text: string;
      parse_mode?: string;
      reply_markup?: unknown;
      message_thread_id?: number;
    } = {
      chat_id: chatId,
      text,
    };

    if (options?.parseMode) {
      payload.parse_mode = options.parseMode;
    }

    if (options?.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    if (options?.messageThreadId !== undefined) {
      payload.message_thread_id = options.messageThreadId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      this.logger.error(
        `❌ Telegram API error: status=${response.status}, response=${responseText}, chatId=${chatId}`,
      );
      throw new Error(`Telegram API error: ${response.status} ${responseText}`);
    }

    this.logger.log(`✅ Message sent successfully to chat ${chatId}`);
  }

  async notifyNewLabOrder(
    order: OrderDto,
    wizardData: {
      clothingType: string | null;
      size: string | null;
      colorChoice: string | null;
      customColor: string | null;
      placement: string | null;
      description: string;
      attachmentUrl?: string | null;
    },
    buyerInfo?: { username?: string; firstName?: string; lastName?: string; telegramId?: string },
  ): Promise<void> {
    this.logger.log(
      `📤 Preparing to send LAB order notification: orderId=${order.id}, hasToken=${!!this.botToken}`,
    );

    if (!this.botToken) {
      this.logger.warn(`⚠️ TELEGRAM_BOT_TOKEN not configured - skipping LAB order notification`);
      return;
    }

    try {
      // Format clothing type
      const clothingTypeText =
        wizardData.clothingType === 'custom'
          ? 'Своё'
          : wizardData.clothingType === 'hoodie'
            ? 'Худи'
            : wizardData.clothingType || '—';

      // Format color
      const colorText =
        wizardData.colorChoice === 'black'
          ? 'Черный'
          : wizardData.colorChoice === 'white'
            ? 'Белый'
            : wizardData.colorChoice === 'gray'
              ? 'Серый'
              : wizardData.colorChoice || '—';

      // Format placement
      const placementText =
        wizardData.placement === 'front'
          ? 'Фронт'
          : wizardData.placement === 'back'
            ? 'Спина'
            : wizardData.placement === 'sleeve'
              ? 'Рукав'
              : wizardData.placement === 'individual'
                ? 'Индивидуально'
                : wizardData.placement || '—';

      // Format description (idea)
      const descriptionText = wizardData.description || '—';

      // Build media links (one per line if multiple)
      let mediaText = '—';
      if (wizardData.attachmentUrl) {
        // If there are multiple URLs (future), list each on its own line
        // For now, single attachment URL
        mediaText = wizardData.attachmentUrl;
      }

      // Format client info: @username (id: telegramId)
      let clientText = '—';
      if (buyerInfo?.telegramId) {
        const username = buyerInfo.username ? `@${buyerInfo.username}` : '';
        clientText = username
          ? `${username} (id: ${buyerInfo.telegramId})`
          : `(id: ${buyerInfo.telegramId})`;
      }

      // Build message with required format
      const orderNumber = order.number || `№${order.id.slice(0, 8)}/LAB`;
      const message = `Сестренка, у нас новая темка нарисовалась
Заказ: ${orderNumber}

Что кастомим: ${clothingTypeText}
Цвет: ${colorText}
Место: ${placementText}
Идея клиента: ${descriptionText}
Медиа: ${mediaText}
Клиент: ${clientText}`;

      // Build inline keyboard
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

      const sendPromises: Promise<void>[] = [];

      // 1. Send to ADMIN_TG_ID (DM) if configured
      if (this.adminTgId) {
        this.logger.log(`📡 Sending LAB order notification to admin DM (${this.adminTgId})`);
        sendPromises.push(
          this.sendMessage(this.adminTgId, message, {
            parseMode: 'Markdown',
            replyMarkup: keyboard,
          }).catch((error) => {
            this.logger.error(`❌ Failed to send to admin DM:`, error);
          }),
        );
      }

      // 2. Send to admin chat (DB config or ENV fallback)
      sendPromises.push(
        this.sendToAdminChat(message, {
          parseMode: 'Markdown',
          replyMarkup: keyboard,
        }).catch(() => {
          // Already logged in sendToAdminChat
        }),
      );

      // 3. Legacy: Send to TELEGRAM_ADMIN_CHAT_ID if configured
      if (this.adminChatId && this.adminChatId !== this.adminChatIdNew) {
        this.logger.log(
          `📡 Sending LAB order notification to legacy admin chat (${this.adminChatId})`,
        );
        sendPromises.push(
          this.sendMessage(this.adminChatId, message, {
            parseMode: 'Markdown',
            replyMarkup: keyboard,
          }).catch((error) => {
            this.logger.error(`❌ Failed to send to legacy admin chat:`, error);
          }),
        );
      }

      if (sendPromises.length === 0) {
        this.logger.warn(`⚠️ No admin chat IDs configured - skipping LAB order notification`);
        return;
      }

      await Promise.all(sendPromises);
      this.logger.log(`✅ LAB order ${order.id} notification sent successfully`);
    } catch (error) {
      this.logger.error(`❌ Failed to send LAB order notification for order ${order.id}:`, error);
    }
  }

  async notifyNewOrder(
    order: OrderDto,
    buyerInfo?: { username?: string; firstName?: string; lastName?: string; telegramId?: string },
  ): Promise<void> {
    this.logger.log(
      `📤 Preparing to send order notification: orderId=${order.id}, hasToken=${!!this.botToken}, adminTgId=${!!this.adminTgId}, adminChatId=${!!this.adminChatIdNew}, legacyChatId=${!!this.adminChatId}`,
    );

    if (!this.botToken) {
      this.logger.warn(
        `⚠️ TELEGRAM_BOT_TOKEN not configured - skipping order notification for order ${order.id}`,
      );
      return;
    }

    try {
      const buyerName =
        buyerInfo?.firstName && buyerInfo?.lastName
          ? `${buyerInfo.firstName} ${buyerInfo.lastName}`
          : buyerInfo?.firstName || buyerInfo?.username || 'Не указано';

      const buyerUsername = buyerInfo?.username ? `@${buyerInfo.username}` : '';
      const buyerTelegramId = buyerInfo?.telegramId ? ` (ID: ${buyerInfo.telegramId})` : '';

      // Build items list
      const itemsText = order.items
        .map((item) => {
          const lineTotal = item.priceSnapshot * item.qty;
          return `• ${item.titleSnapshot} ×${item.qty} — ${this.formatPrice(lineTotal)} ₽`;
        })
        .join('\n');

      // Build message
      const orderNumber = order.number || order.id.slice(0, 8);
      const message = `🆕 *Новый заказ ${orderNumber}*

👤 *Покупатель:*
${buyerName}${buyerUsername ? ` ${buyerUsername}` : ''}${buyerTelegramId}
📞 ${order.customerPhone}
${order.customerAddress ? `📍 *Адрес:* ${order.customerAddress}` : ''}

🛍️ *Товары:*
${itemsText}

💰 *Итого: ${this.formatPrice(order.totalAmount)} ₽*
${order.comment ? `\n💬 *Комментарий:*\n${order.comment}` : ''}`;

      // Build inline keyboard
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

      const sendPromises: Promise<void>[] = [];

      // 1. Send to ADMIN_TG_ID (DM) if configured
      if (this.adminTgId) {
        this.logger.log(`📡 Sending order notification to admin DM (${this.adminTgId})`);
        sendPromises.push(
          this.sendMessage(this.adminTgId, message, {
            parseMode: 'Markdown',
            replyMarkup: keyboard,
          }).catch((error) => {
            this.logger.error(`❌ Failed to send to admin DM:`, error);
          }),
        );
      }

      // 2. Send to admin chat (DB config or ENV fallback)
      sendPromises.push(
        this.sendToAdminChat(message, {
          parseMode: 'Markdown',
          replyMarkup: keyboard,
        }).catch(() => {
          // Already logged in sendToAdminChat
        }),
      );

      // 3. Legacy: Send to TELEGRAM_ADMIN_CHAT_ID if configured (for backward compatibility)
      if (this.adminChatId && this.adminChatId !== this.adminChatIdNew) {
        this.logger.log(`📡 Sending order notification to legacy admin chat (${this.adminChatId})`);
        sendPromises.push(
          this.sendMessage(this.adminChatId, message, {
            parseMode: 'Markdown',
            replyMarkup: keyboard,
          }).catch((error) => {
            this.logger.error(`❌ Failed to send to legacy admin chat:`, error);
          }),
        );
      }

      if (sendPromises.length === 0) {
        this.logger.warn(
          `⚠️ No admin chat IDs configured (ADMIN_TG_ID, ADMIN_CHAT_ID, or TELEGRAM_ADMIN_CHAT_ID) - skipping order notification`,
        );
        return;
      }

      await Promise.all(sendPromises);
      this.logger.log(`✅ Order ${order.id} notification sent successfully`);
    } catch (error) {
      // Log failure but don't throw - order creation should succeed
      this.logger.error(`❌ Failed to send order notification for order ${order.id}:`, error);
    }
  }

  /**
   * Send a test notification to admin chat
   * Used for testing bot configuration
   */
  async sendTestNotification(): Promise<{ success: boolean; message?: string; error?: string }> {
    this.logger.log(
      `🧪 Sending test notification: chatId=${this.adminChatId}, hasToken=${!!this.botToken}, hasChatId=${!!this.adminChatId}`,
    );

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
        this.logger.error(
          `❌ Test notification failed: status=${response.status}, response=${responseText}`,
        );
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

  /**
   * Send order status change notification to buyer
   * @param orderNumber Order number (e.g., "№00001/AS") or order ID fallback
   * @param buyerTelegramId Buyer's Telegram ID (chat_id)
   * @param newStatus New order status
   */
  async notifyBuyerStatusChange(
    orderNumber: string,
    buyerTelegramId: string,
    newStatus: string,
  ): Promise<void> {
    // Log before send
    this.logger.log(
      `📤 Preparing to send status change notification: orderNumber=${orderNumber}, chatId=${buyerTelegramId}, newStatus=${newStatus}, hasToken=${!!this.botToken}`,
    );

    if (!this.botToken) {
      this.logger.warn(
        `⚠️ TELEGRAM_BOT_TOKEN not configured - skipping buyer notification for order ${orderNumber}`,
      );
      return;
    }

    if (!buyerTelegramId) {
      this.logger.warn(
        `⚠️ Buyer telegramId not available - skipping notification for order ${orderNumber}`,
      );
      return;
    }

    try {
      // Map status to human-readable text
      const statusTexts: Record<string, string> = {
        NEW: 'Заказ принят.',
        CONFIRMED: 'Заказ подтвержден.',
        IN_PROGRESS: 'Заказ находится в работе.',
        DONE: 'Заказ выполнен.',
        CANCELED: 'Заказ отменен.',
      };

      const humanReadableStatus = statusTexts[newStatus] || `Статус изменен на: ${newStatus}`;

      // Build message
      const message = `Статус вашего заказа ${orderNumber} изменен.\n${humanReadableStatus}`;

      // Send message via Telegram Bot API
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const payload = {
        chat_id: buyerTelegramId,
        text: message,
      };

      this.logger.log(
        `📡 Sending Telegram status notification to chat ${buyerTelegramId} for order ${orderNumber}`,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        // Log error but don't throw - status update should succeed even if notification fails
        this.logger.error(
          `❌ Buyer notification failed for order ${orderNumber}: status=${response.status}, response=${responseText}`,
        );
        return;
      }

      // Log success
      this.logger.log(
        `✅ Buyer notification sent successfully for order ${orderNumber} to chat ${buyerTelegramId}`,
      );
    } catch (error) {
      // Log failure but don't throw - status update should succeed even if notification fails
      this.logger.error(`❌ Failed to send buyer notification for order ${orderNumber}:`, error);
    }
  }

  /**
   * Send a message to admin chat (group) if configured
   * Uses DB config with ENV fallback
   * Reusable helper for all admin chat notifications
   */
  async sendToAdminChat(
    text: string,
    options?: {
      parseMode?: 'Markdown' | 'HTML';
      replyMarkup?: unknown;
    },
  ): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not configured - skipping admin chat message');
      return;
    }

    // Resolve admin chat config (DB priority, ENV fallback)
    const config = await this.resolveAdminChatConfig();

    if (!config.chatId) {
      this.logger.warn(
        '⚠️ Admin chat not configured (neither DB nor ENV) - skipping admin chat message',
      );
      return;
    }

    try {
      await this.sendMessage(config.chatId, text, {
        parseMode: options?.parseMode,
        replyMarkup: options?.replyMarkup,
        messageThreadId: config.threadId ?? undefined,
      });
      this.logger.log(
        `✅ Message sent to admin chat (${config.chatId})${config.threadId ? ` in thread ${config.threadId}` : ''}`,
      );
    } catch (error) {
      // Log warning but don't throw - failures should not crash the app
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `⚠️ Failed to send message to admin chat (${config.chatId}): ${errorMessage}`,
      );
      // Don't throw - failures should be logged but not crash the app
    }
  }

  /**
   * Send subscription reminder notification with inline button
   * Sends to ADMIN_TG_ID (DM) and ADMIN_CHAT_ID (group) if configured
   */
  async sendSubscriptionReminder(
    subscriptionId: string,
    subscriptionName: string,
    dueDateFormatted: string,
    daysRemaining: number,
  ): Promise<void> {
    this.logger.log(
      `📤 Preparing to send subscription reminder: subscriptionId=${subscriptionId}, adminTgId=${!!this.adminTgId}`,
    );

    if (!this.botToken) {
      this.logger.warn(
        `⚠️ TELEGRAM_BOT_TOKEN not configured - skipping subscription reminder for ${subscriptionId}`,
      );
      return;
    }

    try {
      // Build message
      const daysText = daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней';
      const message = `⏰ *Напоминание*

Подписка «${subscriptionName}»
Заканчивается: ${dueDateFormatted}
Осталось ${daysRemaining} ${daysText}.`;

      // Build inline keyboard with update button
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🔄 Обновить дату оплаты',
              callback_data: `update_subscription_payment:${subscriptionId}`,
            },
          ],
        ],
      };

      const sendPromises: Promise<void>[] = [];

      // 1. Send to ADMIN_TG_ID (DM) if configured
      if (this.adminTgId) {
        this.logger.log(`📡 Sending subscription reminder to admin DM (${this.adminTgId})`);
        sendPromises.push(
          this.sendMessage(this.adminTgId, message, {
            parseMode: 'Markdown',
            replyMarkup: keyboard,
          }).catch((error) => {
            this.logger.error(`❌ Failed to send subscription reminder to admin DM:`, error);
          }),
        );
      }

      // 2. Send to admin chat (DB config or ENV fallback)
      sendPromises.push(
        this.sendToAdminChat(message, {
          parseMode: 'Markdown',
          replyMarkup: keyboard,
        }).catch(() => {
          // Already logged in sendToAdminChat
        }),
      );

      // Note: sendToAdminChat already handles the case when no config is available
      // We still send to DM if adminTgId is configured, so check only for that
      if (sendPromises.length === 0) {
        this.logger.warn(
          `⚠️ No admin notifications configured (ADMIN_TG_ID or admin chat) - skipping subscription reminder`,
        );
        return;
      }

      await Promise.all(sendPromises);
      this.logger.log(`✅ Subscription reminder for ${subscriptionId} sent successfully`);
    } catch (error) {
      this.logger.error(`❌ Failed to send subscription reminder for ${subscriptionId}:`, error);
    }
  }

  /**
   * Send subscription payment update confirmation
   */
  async sendSubscriptionUpdateConfirmation(
    subscriptionName: string,
    newDueDateFormatted: string,
  ): Promise<void> {
    const message = `✅ Подписка «${subscriptionName}» обновлена.
Новая дата окончания: ${newDueDateFormatted}`;

    const sendPromises: Promise<void>[] = [];

    // Send to ADMIN_TG_ID (DM) if configured
    if (this.adminTgId) {
      sendPromises.push(
        this.sendMessage(this.adminTgId, message, {
          parseMode: 'Markdown',
        }).catch((error) => {
          this.logger.error(`❌ Failed to send confirmation to admin DM:`, error);
        }),
      );
    }

    // Send to admin chat (DB config or ENV fallback)
    sendPromises.push(
      this.sendToAdminChat(message, { parseMode: 'Markdown' }).catch(() => {
        // Already logged in sendToAdminChat
      }),
    );

    await Promise.all(sendPromises);
    this.logger.log(`✅ Subscription update confirmation sent`);
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price);
  }
}
