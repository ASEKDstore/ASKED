import { Controller, Get, Param } from '@nestjs/common';

import { LabService } from './lab.service';
import type { PublicLabProductDto } from './dto/public-lab-product.dto';
import type { LabWorkDto } from './dto/lab-work.dto';

@Controller('public/lab-products')
export class PublicLabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(): Promise<PublicLabProductDto[]> {
    return this.labService.findAllPublic();
  }
}

@Controller('lab/works')
export class PublicLabWorksController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(): Promise<LabWorkDto[]> {
    return this.labService.findAllPublicWorks();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LabWorkDto> {
    return this.labService.findOneWork(id);
  }

  @Get('slug/:slug')
  async findOneBySlug(@Param('slug') slug: string): Promise<LabWorkDto> {
    return this.labService.findOneWorkBySlug(slug);
  }
}








