import { forwardRef, Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaModule } from '../prisma/prisma.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AnalyticsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}






