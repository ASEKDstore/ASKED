import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { TelegramInitDataService } from './telegram-init-data.service';
import type { TelegramUser } from './types/telegram-user.interface';
import { UsersService } from '../users/users.service';

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
  private readonly logger = new Logger(TelegramAuthGuard.name);

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

      // CRITICAL: Upsert user in database SYNCHRONOUSLY
      // This MUST run on every authenticated request and MUST NOT fail silently
      // Use ModuleRef for lazy loading to avoid requiring UsersModule in all modules that use this guard
      const telegramId = user.id.toString();
      
      try {
        const usersService = this.moduleRef.get(UsersService, { strict: false });
        if (!usersService) {
          // UsersService not available - this is a critical error
          this.logger.error(
            `CRITICAL: UsersService not available in TelegramAuthGuard context - user upsert FAILED for telegramId=${telegramId}`
          );
          // Don't fail auth, but log the error loudly
        } else {
          // Execute upsert SYNCHRONOUSLY - await it to ensure it completes
          // If this fails, we want to see it in logs, but don't fail authentication
          try {
            const upsertedUser = await usersService.upsertByTelegramData(user);
            // Log successful upsert
            this.logger.debug(
              `TG user upserted: telegramId=${upsertedUser.telegramId}, username=${upsertedUser.username || 'null'}, userId=${upsertedUser.id}`
            );
          } catch (upsertError) {
            // Log error LOUDLY - this is critical and should not be silent
            this.logger.error(
              `CRITICAL: Failed to upsert user in TelegramAuthGuard: telegramId=${telegramId}`,
              upsertError instanceof Error ? upsertError.stack : String(upsertError)
            );
            // Don't fail authentication, but ensure error is visible
          }
        }
      } catch (error) {
        // ModuleRef.get may throw if service not found - log CRITICAL error
        this.logger.error(
          `CRITICAL: Could not get UsersService in TelegramAuthGuard: telegramId=${telegramId}`,
          error instanceof Error ? error.stack : String(error)
        );
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
