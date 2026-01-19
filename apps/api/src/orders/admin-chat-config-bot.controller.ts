import {
  Controller,
  Post,
  Get,
  Delete,
  Headers,
  UnauthorizedException,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminChatConfigService } from './admin-chat-config.service';

interface SetAdminChatDto {
  chatId: string;
  threadId?: number | null;
}

/**
 * Controller for bot-initiated admin chat configuration
 * Secured by bot token in X-Bot-Token header
 */
@Controller('telegram/admin-chat-config')
export class AdminChatConfigBotController {
  private readonly botToken: string;

  constructor(
    private readonly adminChatConfigService: AdminChatConfigService,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Get current admin chat configuration
   */
  @Get()
  async getConfig(@Headers('x-bot-token') botToken: string): Promise<{
    success: boolean;
    config?: { chatId: string; threadId: number | null; updatedAt: string } | null;
    error?: string;
  }> {
    // Verify bot token
    if (!botToken || botToken !== this.botToken) {
      throw new UnauthorizedException('Invalid or missing bot token');
    }

    try {
      const config = await this.adminChatConfigService.getConfig();

      return {
        success: true,
        config: config
          ? {
              chatId: config.chatId,
              threadId: config.threadId,
              updatedAt: config.updatedAt.toISOString(),
            }
          : null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Set admin chat configuration
   */
  @Post()
  async setConfig(
    @Headers('x-bot-token') botToken: string,
    @Body() body: SetAdminChatDto,
  ): Promise<{
    success: boolean;
    config?: { chatId: string; threadId: number | null; updatedAt: string };
    error?: string;
  }> {
    // Verify bot token
    if (!botToken || botToken !== this.botToken) {
      throw new UnauthorizedException('Invalid or missing bot token');
    }

    if (!body.chatId) {
      throw new BadRequestException('chatId is required');
    }

    try {
      const config = await this.adminChatConfigService.setConfig(
        body.chatId,
        body.threadId ?? null,
      );

      return {
        success: true,
        config: {
          chatId: config.chatId,
          threadId: config.threadId,
          updatedAt: config.updatedAt.toISOString(),
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

  /**
   * Clear admin chat configuration
   */
  @Delete()
  async clearConfig(
    @Headers('x-bot-token') botToken: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Verify bot token
    if (!botToken || botToken !== this.botToken) {
      throw new UnauthorizedException('Invalid or missing bot token');
    }

    try {
      await this.adminChatConfigService.clearConfig();

      return {
        success: true,
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
