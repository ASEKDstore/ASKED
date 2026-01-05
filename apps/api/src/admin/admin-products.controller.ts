import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminProductsService } from './admin-products.service';
import { adminProductQuerySchema } from './dto/admin-product-query.dto';
import { createAdminProductSchema } from './dto/create-admin-product.dto';
import { updateAdminProductSchema } from './dto/update-admin-product.dto';
import type { AdminProductsListResponse } from './dto/admin-product-list-response.dto';
import type { ProductDto } from '../products/dto/product.dto';

@Controller('admin/products')
@UseGuards(TelegramAuthGuard, AdminGuard)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  async findAll(@Query() query: any): Promise<AdminProductsListResponse> {
    const validatedQuery = adminProductQuerySchema.parse(query);
    return this.adminProductsService.findAll(validatedQuery);
  }

  @Post()
  async create(@Body() body: any): Promise<ProductDto> {
    const createDto = createAdminProductSchema.parse(body);
    return this.adminProductsService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductDto> {
    return this.adminProductsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<ProductDto> {
    const updateDto = updateAdminProductSchema.parse(body);
    return this.adminProductsService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ProductDto> {
    return this.adminProductsService.delete(id);
  }
}

