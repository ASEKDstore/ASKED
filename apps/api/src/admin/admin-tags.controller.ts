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
import { AdminTagsService } from './admin-tags.service';
import { createTagSchema } from './dto/create-tag.dto';
import { updateTagSchema } from './dto/update-tag.dto';
import type { TagDto } from './dto/tag.dto';

@Controller('admin/tags')
@UseGuards(TelegramAuthGuard, AdminGuard)
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}

  @Get()
  async findAll(): Promise<TagDto[]> {
    return this.adminTagsService.findAll();
  }

  @Post()
  async create(@Body() body: any): Promise<TagDto> {
    const createDto = createTagSchema.parse(body);
    return this.adminTagsService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TagDto> {
    return this.adminTagsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<TagDto> {
    const updateDto = updateTagSchema.parse(body);
    return this.adminTagsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminTagsService.delete(id);
  }
}


