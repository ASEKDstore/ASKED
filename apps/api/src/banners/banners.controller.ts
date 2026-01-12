import { Controller, Get } from '@nestjs/common';

import { BannersService } from './banners.service';
import type { BannerDto } from './dto/banner.dto';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async findAll(): Promise<BannerDto[]> {
    return this.bannersService.findAll();
  }
}








