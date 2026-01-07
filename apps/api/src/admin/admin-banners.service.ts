import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { BannerDto, CreateBannerDto, UpdateBannerDto, BannerQueryDto } from './dto/banner.dto';

@Injectable()
export class AdminBannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: BannerQueryDto): Promise<{ items: BannerDto[]; total: number; page: number; pageSize: number }> {
    const { q, isActive, page, pageSize } = query;

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    try {
      const total = await this.prisma.banner.count({ where });
      const banners = await this.prisma.banner.findMany({
        where,
        orderBy: { sort: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const items = banners.map((banner) => ({
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

      return { items, total, page, pageSize };
    } catch (error: any) {
      // Handle case where table doesn't exist yet (P2021 = Table does not exist)
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return { items: [], total: 0, page, pageSize };
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<BannerDto> {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException(`Banner with id ${id} not found`);
    }

    return {
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
    };
  }

  async create(createDto: CreateBannerDto): Promise<BannerDto> {
    // Validate promoSlug exists
    const promoExists = await this.prisma.promoPage.findUnique({
      where: { slug: createDto.promoSlug },
    });

    if (!promoExists) {
      throw new BadRequestException(`PromoPage with slug "${createDto.promoSlug}" not found`);
    }

    const banner = await this.prisma.banner.create({
      data: {
        title: createDto.title,
        subtitle: createDto.subtitle ?? null,
        mediaType: createDto.mediaType,
        mediaUrl: createDto.mediaUrl,
        isActive: createDto.isActive ?? true,
        sort: createDto.sort ?? 0,
        promoSlug: createDto.promoSlug,
      },
    });

    return {
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
    };
  }

  async update(id: string, updateDto: UpdateBannerDto): Promise<BannerDto> {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Banner with id ${id} not found`);
    }

    // Validate promoSlug if being updated
    if (updateDto.promoSlug && updateDto.promoSlug !== existing.promoSlug) {
      const promoExists = await this.prisma.promoPage.findUnique({
        where: { slug: updateDto.promoSlug },
      });

      if (!promoExists) {
        throw new BadRequestException(`PromoPage with slug "${updateDto.promoSlug}" not found`);
      }
    }

    const banner = await this.prisma.banner.update({
      where: { id },
      data: updateDto,
    });

    return {
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
    };
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Banner with id ${id} not found`);
    }

    // Soft delete: set isActive to false
    await this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });
  }
}


