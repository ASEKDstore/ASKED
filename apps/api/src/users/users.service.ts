import { Injectable } from '@nestjs/common';

import type { TelegramUser } from '../auth/types/telegram-user.interface';
import { PrismaService } from '../prisma/prisma.service';

import { userResponseSchema, type UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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




