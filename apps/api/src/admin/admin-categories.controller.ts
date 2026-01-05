import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminCategoriesService } from './admin-categories.service';
import { createCategorySchema } from './dto/create-category.dto';
import { updateCategorySchema } from './dto/update-category.dto';
import type { CategoryDto } from './dto/category.dto';

@Controller('admin/categories')
@UseGuards(TelegramAuthGuard, AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) {}

  @Get()
  async findAll(): Promise<CategoryDto[]> {
    return this.adminCategoriesService.findAll();
  }

  @Post()
  async create(@Body() body: any): Promise<CategoryDto> {
    const createDto = createCategorySchema.parse(body);
    return this.adminCategoriesService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryDto> {
    return this.adminCategoriesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<CategoryDto> {
    const updateDto = updateCategorySchema.parse(body);
    return this.adminCategoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminCategoriesService.delete(id);
  }
}


