import { Module } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

import { AdminLabController } from './admin-lab.controller';
import { LabService } from './lab.service';
import { PublicLabController } from './public-lab.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminLabController, PublicLabController],
  providers: [LabService, DevAdminAuthGuard, AdminGuard],
  exports: [LabService],
})
export class LabModule {}







