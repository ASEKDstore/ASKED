import { Module } from '@nestjs/common';

import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { DevAdminAuthGuard } from './dev-admin-auth.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramInitDataService } from './telegram-init-data.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [TelegramInitDataService, TelegramAuthGuard, DevAdminAuthGuard, AdminGuard],
  exports: [TelegramInitDataService, TelegramAuthGuard, DevAdminAuthGuard, AdminGuard],
})
export class AuthModule {}
