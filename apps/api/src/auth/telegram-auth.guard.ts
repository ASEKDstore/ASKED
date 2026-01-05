import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { TelegramInitDataService } from './telegram-init-data.service';
import type { TelegramUser } from './types/telegram-user.interface';

export interface AuthenticatedRequest {
  user: TelegramUser;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private readonly telegramInitDataService: TelegramInitDataService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: TelegramUser;
      isDevAdmin?: boolean;
    }>();

    // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
    // If dev admin is already authenticated, skip Telegram auth
    if (request.isDevAdmin === true) {
      return true;
    }

    const initDataHeader = request.headers['x-telegram-init-data'];

    if (!initDataHeader) {
      throw new UnauthorizedException('Missing x-telegram-init-data header');
    }

    // Handle header as string or array
    const initData = typeof initDataHeader === 'string' ? initDataHeader : initDataHeader[0];

    if (!initData) {
      throw new UnauthorizedException('Missing x-telegram-init-data header');
    }

    try {
      const user = this.telegramInitDataService.validateAndParse(initData);
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Telegram initData');
    }
  }
}
