import { Controller, Get } from '@nestjs/common';

import { LabService } from './lab.service';
import type { PublicLabProductDto } from './dto/public-lab-product.dto';

@Controller('public/lab-products')
export class PublicLabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  async findAll(): Promise<PublicLabProductDto[]> {
    return this.labService.findAllPublic();
  }
}




