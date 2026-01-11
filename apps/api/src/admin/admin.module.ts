import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

import { AdminBannersController } from './admin-banners.controller';
import { AdminBannersService } from './admin-banners.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminPromosController } from './admin-promos.controller';
import { AdminPromosService } from './admin-promos.service';
import { AdminTagsController } from './admin-tags.controller';
import { AdminTagsService } from './admin-tags.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [OrdersModule, ProductsModule, AuthModule, PrismaModule, UsersModule, NotificationsModule],
  controllers: [
    AdminController,
    AdminOrdersController,
    AdminProductsController,
    AdminCategoriesController,
    AdminTagsController,
    AdminBannersController,
    AdminPromosController,
    AdminNotificationsController,
    AdminUsersController,
  ],
  providers: [
    AdminProductsService,
    AdminCategoriesService,
    AdminTagsService,
    AdminBannersService,
    AdminPromosService,
  ],
})
export class AdminModule {}
