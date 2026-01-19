import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

import { AdminPoletService } from './admin-polet.service';
import { createPoletSchema } from './dto/create-polet.dto';
import { updatePoletSchema } from './dto/update-polet.dto';
import { createPoziciyaSchema } from './dto/create-poziciya.dto';
import { updatePoziciyaSchema } from './dto/update-poziciya.dto';
import type { PoletDto } from './dto/polet.dto';

@Controller('admin/polet')
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminPoletController {
  private readonly logger = new Logger(AdminPoletController.name);

  constructor(private readonly poletService: AdminPoletService) {}

  @Get()
  async findAll(@Query('includeDeleted') includeDeleted?: string): Promise<PoletDto[]> {
    try {
      this.logger.log('GET /admin/polet - Fetching all poleti');
      const result = await this.poletService.findAll(includeDeleted === 'true');
      this.logger.log(`GET /admin/polet - Success: found ${result.length} poleti`);
      return result;
    } catch (error) {
      this.logger.error('GET /admin/polet - Error:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<PoletDto> {
    return this.poletService.findOne(id, includeDeleted === 'true');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<PoletDto> {
    const dto = createPoletSchema.parse(body);
    return this.poletService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<PoletDto> {
    const dto = updatePoletSchema.parse(body);
    return this.poletService.update(id, dto);
  }

  @Post(':id/poziciya')
  @HttpCode(HttpStatus.CREATED)
  async addPoziciya(@Param('id') poletId: string, @Body() body: unknown): Promise<PoletDto> {
    const dto = createPoziciyaSchema.parse(body);
    return this.poletService.addPoziciya(poletId, dto);
  }

  @Patch(':id/poziciya/:poziciyaId')
  async updatePoziciya(
    @Param('id') poletId: string,
    @Param('poziciyaId') poziciyaId: string,
    @Body() body: unknown,
  ): Promise<PoletDto> {
    const dto = updatePoziciyaSchema.parse(body);
    return this.poletService.updatePoziciya(poletId, poziciyaId, dto);
  }

  @Delete(':id/poziciya/:poziciyaId')
  @HttpCode(HttpStatus.OK)
  async deletePoziciya(
    @Param('id') poletId: string,
    @Param('poziciyaId') poziciyaId: string,
  ): Promise<PoletDto> {
    return this.poletService.deletePoziciya(poletId, poziciyaId);
  }

  @Post(':id/poluchen')
  @HttpCode(HttpStatus.OK)
  async poluchen(@Param('id') id: string): Promise<PoletDto> {
    return this.poletService.poluchen(id);
  }

  @Post(':id/razobrat')
  @HttpCode(HttpStatus.OK)
  async razobrat(@Param('id') id: string): Promise<PoletDto> {
    return this.poletService.razobrat(id);
  }

  @Post(':id/sozdat-tovar/:poziciyaId')
  @HttpCode(HttpStatus.OK)
  async sozdatTovar(@Param('id') id: string, @Param('poziciyaId') poziciyaId: string): Promise<PoletDto> {
    return this.poletService.sozdatTovar(id, poziciyaId);
  }

  @Post(':id/provesti')
  @HttpCode(HttpStatus.OK)
  async provesti(@Param('id') id: string): Promise<PoletDto> {
    return this.poletService.provesti(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<PoletDto> {
    // TODO: Get admin user ID from request context when available
    return this.poletService.delete(id);
  }
}

