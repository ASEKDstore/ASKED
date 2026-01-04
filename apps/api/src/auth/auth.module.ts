import { Module } from '@nestjs/common';
import { TelegramInitDataService } from './telegram-init-data.service';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [TelegramInitDataService, TelegramAuthGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard],
})
export class AuthModule {}

