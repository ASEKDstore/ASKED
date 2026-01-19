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
import type { LabWorkDto, LabWorkMediaDto, LabWorksListResponse } from './dto/lab-work.dto';
import {
  labWorkQuerySchema,
  createLabWorkSchema,
  updateLabWorkSchema,
  createLabWorkMediaSchema,
  updateLabWorkMediaSchema,
} from './dto/lab-work.dto';
import { LabService } from './lab.service';

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
  async addMedia(
    @Param('id') labProductId: string,
    @Body() body: any,
  ): Promise<LabProductMediaDto> {
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

@Controller('admin/lab/works')
@UseGuards(DevAdminAuthGuard, AdminGuard)
export class AdminLabWorksController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(@Query() query: any): Promise<LabWorksListResponse> {
    const validatedQuery = labWorkQuerySchema.parse(query);
    return this.labService.findAllWorks(validatedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LabWorkDto> {
    return this.labService.findOneWork(id);
  }

  @Post()
  async create(@Body() body: any): Promise<LabWorkDto> {
    const createDto = createLabWorkSchema.parse(body);
    return this.labService.createWork(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any): Promise<LabWorkDto> {
    const updateDto = updateLabWorkSchema.parse(body);
    return this.labService.updateWork(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.labService.deleteWork(id);
  }

  @Post(':id/media')
  async addMedia(@Param('id') labWorkId: string, @Body() body: any): Promise<LabWorkMediaDto> {
    const createDto = createLabWorkMediaSchema.parse(body);
    return this.labService.addWorkMedia(labWorkId, createDto);
  }

  @Patch(':id/media/:mediaId')
  async updateMedia(@Param('mediaId') id: string, @Body() body: any): Promise<LabWorkMediaDto> {
    const updateDto = updateLabWorkMediaSchema.parse(body);
    return this.labService.updateWorkMedia(id, updateDto);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string): Promise<LabWorkDto> {
    return this.labService.publishWork(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string): Promise<LabWorkDto> {
    return this.labService.archiveWork(id);
  }

  @Patch(':id/media/reorder')
  async reorderMedia(
    @Param('id') labWorkId: string,
    @Body() body: { mediaIds: string[] },
  ): Promise<LabWorkMediaDto[]> {
    return this.labService.reorderWorkMedia(labWorkId, body.mediaIds);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(@Param('mediaId') mediaId: string): Promise<void> {
    return this.labService.deleteWorkMedia(mediaId);
  }
}
