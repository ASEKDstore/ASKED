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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';

import { LabService } from './lab.service';
import type {
  LabProductDto,
  LabProductMediaDto,
  LabProductsListResponse,
} from './dto/lab-product.dto';
import {
  labProductQuerySchema,
  createLabProductSchema,
  updateLabProductSchema,
  createLabProductMediaSchema,
  updateLabProductMediaSchema,
} from './dto/lab-product.dto';

@Controller('admin/lab-products')
@UseGuards(DevAdminAuthGuard, AdminGuard)
export class AdminLabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(@Query() query: any): Promise<LabProductsListResponse> {
    const validatedQuery = labProductQuerySchema.parse(query);
    return this.labService.findAll(validatedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LabProductDto> {
    return this.labService.findOne(id);
  }

  @Post()
  async create(@Body() body: any): Promise<LabProductDto> {
    const createDto = createLabProductSchema.parse(body);
    return this.labService.create(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any): Promise<LabProductDto> {
    const updateDto = updateLabProductSchema.parse(body);
    return this.labService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.labService.delete(id);
  }

  @Post(':id/media')
  async addMedia(@Param('id') labProductId: string, @Body() body: any): Promise<LabProductMediaDto> {
    const createDto = createLabProductMediaSchema.parse(body);
    return this.labService.addMedia(labProductId, createDto);
  }

  @Patch('media/:id')
  async updateMedia(@Param('id') id: string, @Body() body: any): Promise<LabProductMediaDto> {
    const updateDto = updateLabProductMediaSchema.parse(body);
    return this.labService.updateMedia(id, updateDto);
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(@Param('id') id: string): Promise<void> {
    return this.labService.deleteMedia(id);
  }
}

