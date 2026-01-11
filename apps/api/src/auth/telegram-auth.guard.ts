import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { TelegramInitDataService } from './telegram-init-data.service';
import type { TelegramUser } from './types/telegram-user.interface';
import type { UsersService } from '../users/users.service';

export interface AuthenticatedRequest {
  user: TelegramUser;
  telegramUser?: {
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  private readonly botToken: string;

  constructor(
    private readonly telegramInitDataService: TelegramInitDataService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: TelegramUser;
      telegramUser?: {
        telegramId: string;
        username?: string;
        firstName?: string;
        lastName?: string;
      };
      isDevAdmin?: boolean;
    }>();

    // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
    // If dev admin is already authenticated, skip Telegram auth
    if (request.isDevAdmin === true) {
      return true;
    }

    // Header name MUST be exactly: "x-telegram-init-data"
    // Express normalizes headers to lowercase, so this is sufficient
    const initDataHeader = request.headers['x-telegram-init-data'];

    if (!initDataHeader) {
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }

    // Handle header as string or array
    const initData = typeof initDataHeader === 'string' ? initDataHeader : initDataHeader[0];

    if (!initData || initData.trim() === '') {
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }

    try {
      // Verify initData using the official algorithm
      if (!this.telegramInitDataService.verifyTelegramInitData(initData, this.botToken)) {
        throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
      }

      // Parse user from initData
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      
      if (!userStr) {
        throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
      }

      const user = JSON.parse(userStr) as TelegramUser;

      // Validate required fields
      if (!user.id || !user.first_name) {
        throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
      }

      // Attach user to request (for compatibility with existing code)
      request.user = {
        ...user,
        auth_date: parseInt(params.get('auth_date') || '0', 10),
        hash: params.get('hash') || '',
      };

      // Attach telegramUser with simplified format (as requested)
      request.telegramUser = {
        telegramId: user.id.toString(),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      // Automatically upsert user in database (fire and forget to avoid blocking auth)
      // This ensures users are persisted when they open the app
      // Use ModuleRef to get UsersService lazily to avoid circular dependency
      try {
        const usersService = this.moduleRef.get<UsersService>('UsersService', { strict: false });
        if (usersService) {
          void usersService.upsertByTelegramData(user).catch((error: unknown) => {
            // Log error but don't fail authentication
            console.error('Failed to upsert user in TelegramAuthGuard:', error);
          });
        }
      } catch (error) {
        // ModuleRef.get may throw if service not found - ignore silently
        // This is expected if UsersModule is not imported
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Any other error (JSON parse, etc.) should result in 401
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }
  }
}
