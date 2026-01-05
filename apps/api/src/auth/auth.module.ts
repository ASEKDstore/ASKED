import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { DevAdminAuthGuard } from './dev-admin-auth.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramInitDataService } from './telegram-init-data.service';

@Module({
  controllers: [AuthController],
  providers: [TelegramInitDataService, TelegramAuthGuard, DevAdminAuthGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard, DevAdminAuthGuard],
})
export class AuthModule {}
