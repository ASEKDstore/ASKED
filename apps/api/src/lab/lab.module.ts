import { Module } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthCoreModule } from '../auth/telegram-auth-core.module';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminLabController, AdminLabWorksController } from './admin-lab.controller';
import { LabService } from './lab.service';
import { PublicLabController, PublicLabWorksController } from './public-lab.controller';

@Module({
  imports: [PrismaModule, TelegramAuthCoreModule],
  controllers: [AdminLabController, AdminLabWorksController, PublicLabController, PublicLabWorksController],
  providers: [LabService, DevAdminAuthGuard, AdminGuard],
  exports: [LabService],
})
export class LabModule {}








