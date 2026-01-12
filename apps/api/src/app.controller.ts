import { Controller, Get, UseGuards, UnauthorizedException } from '@nestjs/common';

import { CurrentTelegramUser } from './auth/decorators/current-telegram-user.decorator';
import { TelegramAuthGuard } from './auth/telegram-auth.guard';
import type { TelegramUser } from './auth/types/telegram-user.interface';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): {
    status: string;
    timestamp: string;
    apiVersion: string;
    webVersion?: string;
    gitCommit?: string;
  } {
    // Read version from package.json (single source of truth)
    // Fallback to env variable if package.json read fails
    let apiVersion: string;
    if (process.env.APP_VERSION) {
      apiVersion = process.env.APP_VERSION;
    } else {
      try {
        apiVersion = require('../package.json').version;
      } catch {
        apiVersion = 'unknown';
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      apiVersion,
      webVersion: process.env.WEB_VERSION || undefined,
      gitCommit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || undefined,
    };
  }

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  async getMe(@CurrentTelegramUser() telegramUser: TelegramUser | undefined): Promise<{
    telegramId: string;
    username: string | null;
  }> {
    if (!telegramUser) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.usersService.upsertByTelegramData(telegramUser);
    return {
      telegramId: user.telegramId,
      username: user.username,
    };
  }
}






