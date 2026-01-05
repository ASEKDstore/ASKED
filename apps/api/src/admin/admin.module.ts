import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminTagsController } from './admin-tags.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminTagsService } from './admin-tags.service';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [OrdersModule, ProductsModule, AuthModule, PrismaModule],
  controllers: [
    AdminController,
    AdminOrdersController,
    AdminProductsController,
    AdminCategoriesController,
    AdminTagsController,
  ],
  providers: [AdminProductsService, AdminCategoriesService, AdminTagsService],
})
export class AdminModule {}

