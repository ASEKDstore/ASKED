import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

@Module({
  imports: [PrismaModule],
  providers: [WarehouseService],
  controllers: [WarehouseController],
  exports: [WarehouseService],
})
export class WarehouseModule {}

