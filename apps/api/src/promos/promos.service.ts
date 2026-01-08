import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { PromoDto } from './dto/promo.dto';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<PromoDto> {
    const promo = await this.prisma.promoPage.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException(`PromoPage with slug "${slug}" not found or inactive`);
    }

    return {
      id: promo.id,
      slug: promo.slug,
      title: promo.title,
      description: promo.description,
      isActive: promo.isActive,
      ctaType: promo.ctaType as 'PRODUCT' | 'URL',
      ctaText: promo.ctaText,
      ctaUrl: promo.ctaUrl,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
      media: promo.media.map((m) => ({
        id: m.id,
        promoId: m.promoId,
        mediaType: m.mediaType as 'IMAGE' | 'VIDEO',
        mediaUrl: m.mediaUrl,
        sort: m.sort,
      })),
    };
  }
}



