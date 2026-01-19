import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';

import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { DevAdminAuthGuard } from './dev-admin-auth.guard';
import { TelegramAuthCoreModule } from './telegram-auth-core.module';

@Module({
  imports: [UsersModule, TelegramAuthCoreModule],
  controllers: [AuthController],
  providers: [DevAdminAuthGuard, AdminGuard],
  exports: [TelegramAuthCoreModule, DevAdminAuthGuard, AdminGuard],
})
export class AuthModule {}
