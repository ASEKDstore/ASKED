import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface AdminChatConfigDto {
  chatId: string;
  threadId: number | null;
  updatedAt: Date;
}

@Injectable()
export class AdminChatConfigService {
  private readonly logger = new Logger(AdminChatConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current admin chat configuration
   */
  async getConfig(): Promise<AdminChatConfigDto | null> {
    try {
      const config = await this.prisma.adminChatConfig.findUnique({
        where: { id: 1 },
      });

      if (!config) {
        return null;
      }

      return {
        chatId: config.chatId,
        threadId: config.threadId,
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to get admin chat config:', error);
      return null;
    }
  }

  /**
   * Set admin chat configuration (upsert single row)
   */
  async setConfig(chatId: string, threadId: number | null): Promise<AdminChatConfigDto> {
    try {
      const config = await this.prisma.adminChatConfig.upsert({
        where: { id: 1 },
        update: {
          chatId,
          threadId,
        },
        create: {
          id: 1,
          chatId,
          threadId,
        },
      });

      this.logger.log(
        `✅ Admin chat config updated: chatId=${chatId}, threadId=${threadId || 'null'}`,
      );

      return {
        chatId: config.chatId,
        threadId: config.threadId,
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to set admin chat config:', error);
      throw error;
    }
  }

  /**
   * Clear admin chat configuration
   */
  async clearConfig(): Promise<void> {
    try {
      await this.prisma.adminChatConfig
        .delete({
          where: { id: 1 },
        })
        .catch(() => {
          // Ignore if config doesn't exist (idempotent)
        });

      this.logger.log('✅ Admin chat config cleared');
    } catch (error) {
      this.logger.error('Failed to clear admin chat config:', error);
      throw error;
    }
  }
}
