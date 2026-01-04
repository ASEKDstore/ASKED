import { Controller, Get, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { TelegramUser } from '../auth/decorators/telegram-user.decorator';
import { UsersService } from './users.service';
import type { TelegramUser as TelegramUserType } from '../auth/types/telegram-user.interface';
import type { UserResponseDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  async getMe(
    @TelegramUser() telegramUser: TelegramUserType
  ): Promise<UserResponseDto> {
    return this.usersService.upsertByTelegramData(telegramUser);
  }
}

