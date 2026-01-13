import { Module } from '@nestjs/common';

import { TelegramAuthCoreModule } from '../auth/telegram-auth-core.module';
import { PrismaModule } from '../prisma/prisma.module';

import { PurchasesService } from './purchases.service';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

@Module({
  imports: [PrismaModule, TelegramAuthCoreModule],
  providers: [WarehouseService, PurchasesService],
  controllers: [WarehouseController],
  exports: [WarehouseService, PurchasesService],
})
export class WarehouseModule {}

