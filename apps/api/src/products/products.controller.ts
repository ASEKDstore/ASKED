import { Controller, Get, Param, Query } from '@nestjs/common';

import { productQuerySchema } from './dto/product-query.dto';
import type { ProductDto, ProductListItemDto, ProductsListResponse } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: any): Promise<ProductsListResponse> {
    const validatedQuery = productQuerySchema.parse(query);
    return this.productsService.findAll(validatedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductDto> {
    return this.productsService.findOne(id);
  }

  @Get(':id/similar')
  async findSimilar(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ): Promise<ProductListItemDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 8;
    const safeLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 50 ? 8 : limitNum;
    return this.productsService.findSimilar(id, safeLimit);
  }
}
