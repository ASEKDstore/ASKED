import { Module } from '@nestjs/common';

import { TelegramAuthCoreModule } from '../auth/telegram-auth-core.module';
import { PrismaModule } from '../prisma/prisma.module';

import { PurchasesService } from './purchases.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';

@Module({
  imports: [PrismaModule, TelegramAuthCoreModule],
  providers: [WarehouseService, PurchasesService],
  controllers: [WarehouseController],
  exports: [WarehouseService, PurchasesService],
})
export class WarehouseModule {}
