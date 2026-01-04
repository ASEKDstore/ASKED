import { Controller, Get, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { CurrentTelegramUser } from '../auth/decorators/current-telegram-user.decorator';
import { UsersService } from './users.service';
import type { TelegramUser } from '../auth/types/telegram-user.interface';
import type { UserResponseDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  async getMe(
    @CurrentTelegramUser() telegramUser: TelegramUser
  ): Promise<UserResponseDto> {
    return this.usersService.upsertByTelegramData(telegramUser);
  }
}

