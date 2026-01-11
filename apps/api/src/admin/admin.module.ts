import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

import { AdminBannersController } from './admin-banners.controller';
import { AdminBannersService } from './admin-banners.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminPromosController } from './admin-promos.controller';
import { AdminPromosService } from './admin-promos.service';
import { AdminTagsController } from './admin-tags.controller';
import { AdminTagsService } from './admin-tags.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [OrdersModule, ProductsModule, AuthModule, PrismaModule, UsersModule],
  controllers: [
    AdminController,
    AdminOrdersController,
    AdminProductsController,
    AdminCategoriesController,
    AdminTagsController,
    AdminBannersController,
    AdminPromosController,
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
