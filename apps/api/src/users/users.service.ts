import { Injectable } from '@nestjs/common';

import { AppEventsService } from '../analytics/app-events.service';
import { AppOpensService } from '../analytics/app-opens.service';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { PrismaService } from '../prisma/prisma.service';

import { userResponseSchema, type UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appOpensService: AppOpensService,
    private readonly appEventsService: AppEventsService,
  ) {}

  async upsertByTelegramData(telegramUser: TelegramUser): Promise<UserResponseDto> {
    const telegramId = telegramUser.id.toString();

    const user = await this.prisma.user.upsert({
      where: {
        telegramId,
      },
      update: {
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        photoUrl: telegramUser.photo_url || null,
      },
      create: {
        telegramId,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        photoUrl: telegramUser.photo_url || null,
      },
    });

    // Track app open event (fire and forget - don't fail user creation if this fails)
    // Use void to explicitly ignore the promise
    void Promise.all([
      this.appOpensService
        .trackAppOpen(telegramId, telegramUser.username || undefined)
        .catch((error) => {
          console.error('Failed to track app open:', error);
        }),
      this.appEventsService
        .createEvent({
          eventType: 'APP_OPEN',
          userId: telegramId,
          source: 'telegram',
        })
        .catch((error) => {
          console.error('Failed to track app event:', error);
        }),
    ]).catch(() => {
      // Ignore errors - analytics should not break user creation
    });

    // Validate and return only allowed fields
    return userResponseSchema.parse({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    });
  }
}
