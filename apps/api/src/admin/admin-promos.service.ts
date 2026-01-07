import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { PromoDto, CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';

@Injectable()
export class AdminPromosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PromoDto[]> {
    try {
      const promos = await this.prisma.promoPage.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          media: {
            orderBy: { sort: 'asc' },
          },
        },
      });

      return promos.map((promo) => ({
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
      }));
    } catch (error: any) {
      // Handle case where table doesn't exist yet (P2021 = Table does not exist)
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<PromoDto> {
    const promo = await this.prisma.promoPage.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException(`PromoPage with id ${id} not found`);
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

  async findBySlug(slug: string): Promise<PromoDto> {
    const promo = await this.prisma.promoPage.findUnique({
      where: { slug },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException(`PromoPage with slug "${slug}" not found`);
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

  async create(createDto: CreatePromoDto): Promise<PromoDto> {
    // Check if slug already exists
    const existing = await this.prisma.promoPage.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException(`PromoPage with slug "${createDto.slug}" already exists`);
    }

    const { media, ...promoData } = createDto;

    const promo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.promoPage.create({
        data: {
          slug: promoData.slug,
          title: promoData.title,
          description: promoData.description ?? null,
          isActive: promoData.isActive ?? true,
          ctaType: promoData.ctaType ?? 'URL',
          ctaText: promoData.ctaText ?? null,
          ctaUrl: promoData.ctaUrl ?? null,
        },
      });

      if (media && media.length > 0) {
        await tx.promoMedia.createMany({
          data: media.map((m) => ({
            promoId: created.id,
            mediaType: m.mediaType,
            mediaUrl: m.mediaUrl,
            sort: m.sort ?? 0,
          })),
        });
      }

      return created.id;
    });

    return this.findOne(promo);
  }

  async update(id: string, updateDto: UpdatePromoDto): Promise<PromoDto> {
    const existing = await this.prisma.promoPage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`PromoPage with id ${id} not found`);
    }

    // Check if slug is being changed and if new slug already exists
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      const slugExists = await this.prisma.promoPage.findUnique({
        where: { slug: updateDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(`PromoPage with slug "${updateDto.slug}" already exists`);
      }
    }

    const { media, ...promoData } = updateDto;

    await this.prisma.$transaction(async (tx) => {
      await tx.promoPage.update({
        where: { id },
        data: promoData,
      });

      // Replace media if provided
      if (media !== undefined) {
        await tx.promoMedia.deleteMany({
          where: { promoId: id },
        });

        if (media.length > 0) {
          await tx.promoMedia.createMany({
            data: media.map((m) => ({
              promoId: id,
              mediaType: m.mediaType,
              mediaUrl: m.mediaUrl,
              sort: m.sort ?? 0,
            })),
          });
        }
      }
    });

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.promoPage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`PromoPage with id ${id} not found`);
    }

    // Soft delete: set isActive to false
    await this.prisma.promoPage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

