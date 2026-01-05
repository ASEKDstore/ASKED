import { Controller, Get, Param, Query } from '@nestjs/common';

import { productQuerySchema } from './dto/product-query.dto';
import type { ProductDto, ProductsListResponse } from './dto/product.dto';
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
}
