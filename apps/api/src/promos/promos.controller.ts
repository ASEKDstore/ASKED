import { Controller, Get, Param, NotFoundException } from '@nestjs/common';

import type { PromoDto } from './dto/promo.dto';
import { PromosService } from './promos.service';

@Controller('promo')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<PromoDto> {
    try {
      return await this.promosService.findBySlug(slug);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`PromoPage with slug "${slug}" not found`);
    }
  }
}

