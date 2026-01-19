import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { BannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BannerDto[]> {
    const banners = await this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
    });

    return banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      mediaType: banner.mediaType as 'IMAGE' | 'VIDEO',
      mediaUrl: banner.mediaUrl,
      isActive: banner.isActive,
      sort: banner.sort,
      promoSlug: banner.promoSlug,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    }));
  }
}

