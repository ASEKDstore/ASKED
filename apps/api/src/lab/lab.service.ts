import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import type {
  LabProductDto,
  LabProductMediaDto,
  LabProductsListResponse,
  CreateLabProductDto,
  UpdateLabProductDto,
  LabProductQueryDto,
  CreateLabProductMediaDto,
  UpdateLabProductMediaDto,
} from './dto/lab-product.dto';
import type { PublicLabProductDto } from './dto/public-lab-product.dto';
import type {
  LabWorkDto,
  LabWorkMediaDto,
  LabWorksListResponse,
  CreateLabWorkDto,
  UpdateLabWorkDto,
  LabWorkQueryDto,
  CreateLabWorkMediaDto,
  UpdateLabWorkMediaDto,
  RateLabWorkDto,
  RateLabWorkResponse,
} from './dto/lab-work.dto';

@Injectable()
export class LabService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LabProductQueryDto): Promise<LabProductsListResponse> {
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

    const total = await this.prisma.labProduct.count({ where });
    const products = await this.prisma.labProduct.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        gallery: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const items = products.map((product) => ({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: product.price,
      currency: product.currency,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      coverMediaType: product.coverMediaType as 'IMAGE' | 'VIDEO',
      coverMediaUrl: product.coverMediaUrl,
      ctaType: product.ctaType as 'NONE' | 'PRODUCT' | 'URL',
      ctaProductId: product.ctaProductId,
      ctaUrl: product.ctaUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      gallery: product.gallery.map((media) => ({
        id: media.id,
        labProductId: media.labProductId,
        type: media.type as 'IMAGE' | 'VIDEO',
        url: media.url,
        sortOrder: media.sortOrder,
        createdAt: media.createdAt.toISOString(),
      })),
    }));

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<LabProductDto> {
    const product = await this.prisma.labProduct.findUnique({
      where: { id },
      include: {
        gallery: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`LabProduct with id ${id} not found`);
    }

    return {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: product.price,
      currency: product.currency,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      coverMediaType: product.coverMediaType as 'IMAGE' | 'VIDEO',
      coverMediaUrl: product.coverMediaUrl,
      ctaType: product.ctaType as 'NONE' | 'PRODUCT' | 'URL',
      ctaProductId: product.ctaProductId,
      ctaUrl: product.ctaUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      gallery: product.gallery.map((media) => ({
        id: media.id,
        labProductId: media.labProductId,
        type: media.type as 'IMAGE' | 'VIDEO',
        url: media.url,
        sortOrder: media.sortOrder,
        createdAt: media.createdAt.toISOString(),
      })),
    };
  }

  async create(createDto: CreateLabProductDto): Promise<LabProductDto> {
    // Validate CTA logic
    if (createDto.ctaType === 'PRODUCT' && !createDto.ctaProductId) {
      throw new BadRequestException('ctaProductId is required when ctaType is PRODUCT');
    }
    if (createDto.ctaType === 'URL' && !createDto.ctaUrl) {
      throw new BadRequestException('ctaUrl is required when ctaType is URL');
    }
    if (createDto.ctaType === 'NONE' && (createDto.ctaProductId || createDto.ctaUrl)) {
      throw new BadRequestException('ctaProductId and ctaUrl must be null when ctaType is NONE');
    }

    // Validate product exists if ctaType is PRODUCT
    if (createDto.ctaType === 'PRODUCT' && createDto.ctaProductId) {
      const product = await this.prisma.product.findUnique({
        where: { id: createDto.ctaProductId },
      });
      if (!product) {
        throw new BadRequestException(`Product with id ${createDto.ctaProductId} not found`);
      }
    }

    const product = await this.prisma.labProduct.create({
      data: {
        title: createDto.title,
        subtitle: createDto.subtitle ?? null,
        description: createDto.description ?? null,
        price: createDto.price ?? 0,
        currency: createDto.currency ?? 'RUB',
        isActive: createDto.isActive ?? true,
        sortOrder: createDto.sortOrder ?? 0,
        coverMediaType: createDto.coverMediaType,
        coverMediaUrl: createDto.coverMediaUrl,
        ctaType: createDto.ctaType ?? 'NONE',
        ctaProductId: createDto.ctaType === 'PRODUCT' ? createDto.ctaProductId ?? null : null,
        ctaUrl: createDto.ctaType === 'URL' ? createDto.ctaUrl ?? null : null,
      },
      include: {
        gallery: true,
      },
    });

    return this.findOne(product.id);
  }

  async update(id: string, updateDto: UpdateLabProductDto): Promise<LabProductDto> {
    const existing = await this.prisma.labProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabProduct with id ${id} not found`);
    }

    // Validate CTA logic if ctaType is being updated
    const finalCtaType = updateDto.ctaType ?? existing.ctaType;
    const finalCtaProductId = updateDto.ctaProductId !== undefined ? updateDto.ctaProductId : existing.ctaProductId;
    const finalCtaUrl = updateDto.ctaUrl !== undefined ? updateDto.ctaUrl : existing.ctaUrl;

    if (finalCtaType === 'PRODUCT' && !finalCtaProductId) {
      throw new BadRequestException('ctaProductId is required when ctaType is PRODUCT');
    }
    if (finalCtaType === 'URL' && !finalCtaUrl) {
      throw new BadRequestException('ctaUrl is required when ctaType is URL');
    }
    if (finalCtaType === 'NONE' && (finalCtaProductId || finalCtaUrl)) {
      throw new BadRequestException('ctaProductId and ctaUrl must be null when ctaType is NONE');
    }

    // Validate product exists if ctaType is PRODUCT
    if (finalCtaType === 'PRODUCT' && finalCtaProductId) {
      const product = await this.prisma.product.findUnique({
        where: { id: finalCtaProductId },
      });
      if (!product) {
        throw new BadRequestException(`Product with id ${finalCtaProductId} not found`);
      }
    }

    await this.prisma.labProduct.update({
      where: { id },
      data: {
        ...(updateDto.title !== undefined ? { title: updateDto.title } : {}),
        ...(updateDto.subtitle !== undefined ? { subtitle: updateDto.subtitle ?? null } : {}),
        ...(updateDto.description !== undefined ? { description: updateDto.description ?? null } : {}),
        ...(updateDto.price !== undefined ? { price: updateDto.price } : {}),
        ...(updateDto.currency !== undefined ? { currency: updateDto.currency } : {}),
        ...(updateDto.isActive !== undefined ? { isActive: updateDto.isActive } : {}),
        ...(updateDto.sortOrder !== undefined ? { sortOrder: updateDto.sortOrder } : {}),
        ...(updateDto.coverMediaType !== undefined ? { coverMediaType: updateDto.coverMediaType } : {}),
        ...(updateDto.coverMediaUrl !== undefined ? { coverMediaUrl: updateDto.coverMediaUrl } : {}),
        ...(updateDto.ctaType !== undefined ? { ctaType: updateDto.ctaType } : {}),
        ...(finalCtaType === 'PRODUCT' ? { ctaProductId: finalCtaProductId, ctaUrl: null } : {}),
        ...(finalCtaType === 'URL' ? { ctaUrl: finalCtaUrl, ctaProductId: null } : {}),
        ...(finalCtaType === 'NONE' ? { ctaProductId: null, ctaUrl: null } : {}),
      },
    });

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.labProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabProduct with id ${id} not found`);
    }

    await this.prisma.labProduct.delete({
      where: { id },
    });
  }

  async addMedia(labProductId: string, createDto: CreateLabProductMediaDto): Promise<LabProductMediaDto> {
    const product = await this.prisma.labProduct.findUnique({
      where: { id: labProductId },
    });

    if (!product) {
      throw new NotFoundException(`LabProduct with id ${labProductId} not found`);
    }

    const media = await this.prisma.labProductMedia.create({
      data: {
        labProductId,
        type: createDto.type,
        url: createDto.url,
        sortOrder: createDto.sortOrder ?? 0,
      },
    });

    return {
      id: media.id,
      labProductId: media.labProductId,
      type: media.type as 'IMAGE' | 'VIDEO',
      url: media.url,
      sortOrder: media.sortOrder,
      createdAt: media.createdAt.toISOString(),
    };
  }

  async updateMedia(id: string, updateDto: UpdateLabProductMediaDto): Promise<LabProductMediaDto> {
    const existing = await this.prisma.labProductMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabProductMedia with id ${id} not found`);
    }

    const media = await this.prisma.labProductMedia.update({
      where: { id },
      data: {
        ...(updateDto.type !== undefined ? { type: updateDto.type } : {}),
        ...(updateDto.url !== undefined ? { url: updateDto.url } : {}),
        ...(updateDto.sortOrder !== undefined ? { sortOrder: updateDto.sortOrder } : {}),
      },
    });

    return {
      id: media.id,
      labProductId: media.labProductId,
      type: media.type as 'IMAGE' | 'VIDEO',
      url: media.url,
      sortOrder: media.sortOrder,
      createdAt: media.createdAt.toISOString(),
    };
  }

  async deleteMedia(id: string): Promise<void> {
    const existing = await this.prisma.labProductMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabProductMedia with id ${id} not found`);
    }

    await this.prisma.labProductMedia.delete({
      where: { id },
    });
  }

  async findAllPublic(): Promise<PublicLabProductDto[]> {
    const products = await this.prisma.labProduct.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 50, // Limit for carousel
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      price: product.price,
      currency: product.currency,
      coverMediaType: product.coverMediaType as 'IMAGE' | 'VIDEO',
      coverMediaUrl: product.coverMediaUrl,
      ctaType: product.ctaType as 'NONE' | 'PRODUCT' | 'URL',
      ctaProductId: product.ctaProductId,
      ctaUrl: product.ctaUrl,
    }));
  }

  // ========== LAB WORKS METHODS ==========

  async findAllWorks(query: LabWorkQueryDto): Promise<LabWorksListResponse> {
    const { q, status, page, pageSize } = query;

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.labWork.count({ where });
    const works = await this.prisma.labWork.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    const items = works.map((work) => {
      // Auto-set coverUrl from first media if not set
      const coverUrl = work.coverUrl ?? work.media[0]?.url ?? null;
      return {
        id: work.id,
        title: work.title,
        slug: work.slug,
        description: work.description,
        coverUrl,
        ratingAvg: work.ratingAvg,
        ratingCount: work.ratingCount,
        status: work.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
        media: work.media.map((m) => ({
          id: m.id,
          labWorkId: m.labWorkId,
          type: m.type as 'IMAGE' | 'VIDEO',
          url: m.url,
          sort: m.sort,
        })),
      };
    });

    return { items, total, page, pageSize };
  }

  async findOneWork(id: string): Promise<LabWorkDto> {
    const work = await this.prisma.labWork.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!work) {
      throw new NotFoundException(`LabWork with id ${id} not found`);
    }

    // Auto-set coverUrl from first media if not set
    const coverUrl = work.coverUrl ?? work.media[0]?.url ?? null;
    return {
      id: work.id,
      title: work.title,
      slug: work.slug,
      description: work.description,
      coverUrl,
      ratingAvg: work.ratingAvg,
      ratingCount: work.ratingCount,
      status: work.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      media: work.media.map((m) => ({
        id: m.id,
        labWorkId: m.labWorkId,
        type: m.type as 'IMAGE' | 'VIDEO',
        url: m.url,
        sort: m.sort,
      })),
    };
  }

  async findOneWorkBySlug(slug: string): Promise<LabWorkDto> {
    const work = await this.prisma.labWork.findUnique({
      where: { slug },
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!work) {
      throw new NotFoundException(`LabWork with slug ${slug} not found`);
    }

    return this.findOneWork(work.id);
  }

  async createWork(createDto: CreateLabWorkDto): Promise<LabWorkDto> {
    const work = await this.prisma.labWork.create({
      data: {
        title: createDto.title,
        slug: createDto.slug ?? null,
        description: createDto.description ?? null,
        coverUrl: createDto.coverUrl ?? null,
        ratingAvg: createDto.ratingAvg ?? 0,
        ratingCount: createDto.ratingCount ?? 0,
        status: createDto.status ?? 'DRAFT',
      },
      include: {
        media: true,
      },
    });

    return this.findOneWork(work.id);
  }

  async updateWork(id: string, updateDto: UpdateLabWorkDto): Promise<LabWorkDto> {
    const existing = await this.prisma.labWork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWork with id ${id} not found`);
    }

    await this.prisma.labWork.update({
      where: { id },
      data: {
        ...(updateDto.title !== undefined ? { title: updateDto.title } : {}),
        ...(updateDto.slug !== undefined ? { slug: updateDto.slug ?? null } : {}),
        ...(updateDto.description !== undefined ? { description: updateDto.description ?? null } : {}),
        ...(updateDto.coverUrl !== undefined ? { coverUrl: updateDto.coverUrl ?? null } : {}),
        ...(updateDto.ratingAvg !== undefined ? { ratingAvg: updateDto.ratingAvg } : {}),
        ...(updateDto.ratingCount !== undefined ? { ratingCount: updateDto.ratingCount } : {}),
        ...(updateDto.status !== undefined ? { status: updateDto.status } : {}),
      },
    });

    return this.findOneWork(id);
  }

  async deleteWork(id: string): Promise<void> {
    const existing = await this.prisma.labWork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWork with id ${id} not found`);
    }

    await this.prisma.labWork.delete({
      where: { id },
    });
  }

  async addWorkMedia(labWorkId: string, createDto: CreateLabWorkMediaDto): Promise<LabWorkMediaDto> {
    const work = await this.prisma.labWork.findUnique({
      where: { id: labWorkId },
      include: { media: true },
    });

    if (!work) {
      throw new NotFoundException(`LabWork with id ${labWorkId} not found`);
    }

    const media = await this.prisma.labWorkMedia.create({
      data: {
        labWorkId,
        type: createDto.type,
        url: createDto.url,
        sort: createDto.sort ?? 0,
      },
    });

    // Auto-set coverUrl from first media if not set
    if (!work.coverUrl && work.media.length === 0 && createDto.type === 'IMAGE') {
      await this.prisma.labWork.update({
        where: { id: labWorkId },
        data: { coverUrl: createDto.url },
      });
    }

    return {
      id: media.id,
      labWorkId: media.labWorkId,
      type: media.type as 'IMAGE' | 'VIDEO',
      url: media.url,
      sort: media.sort,
    };
  }

  async updateWorkMedia(id: string, updateDto: UpdateLabWorkMediaDto): Promise<LabWorkMediaDto> {
    const existing = await this.prisma.labWorkMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWorkMedia with id ${id} not found`);
    }

    const media = await this.prisma.labWorkMedia.update({
      where: { id },
      data: {
        ...(updateDto.type !== undefined ? { type: updateDto.type } : {}),
        ...(updateDto.url !== undefined ? { url: updateDto.url } : {}),
        ...(updateDto.sort !== undefined ? { sort: updateDto.sort } : {}),
      },
    });

    return {
      id: media.id,
      labWorkId: media.labWorkId,
      type: media.type as 'IMAGE' | 'VIDEO',
      url: media.url,
      sort: media.sort,
    };
  }

  async deleteWorkMedia(id: string): Promise<void> {
    const existing = await this.prisma.labWorkMedia.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWorkMedia with id ${id} not found`);
    }

    await this.prisma.labWorkMedia.delete({
      where: { id },
    });
  }

  async findAllPublicWorks(limit?: number): Promise<LabWorkDto[]> {
    const works = await this.prisma.labWork.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'desc' }],
      take: limit ?? 50,
      include: {
        media: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    return works.map((work) => {
      // Auto-set coverUrl from first media if not set
      const coverUrl = work.coverUrl ?? work.media[0]?.url ?? null;
      return {
        id: work.id,
        title: work.title,
        slug: work.slug,
        description: work.description,
        coverUrl,
        ratingAvg: work.ratingAvg,
        ratingCount: work.ratingCount,
        status: work.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
        media: work.media.map((m) => ({
          id: m.id,
          labWorkId: m.labWorkId,
          type: m.type as 'IMAGE' | 'VIDEO',
          url: m.url,
          sort: m.sort,
        })),
      };
    });
  }

  async publishWork(id: string): Promise<LabWorkDto> {
    const existing = await this.prisma.labWork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWork with id ${id} not found`);
    }

    await this.prisma.labWork.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    return this.findOneWork(id);
  }

  async archiveWork(id: string): Promise<LabWorkDto> {
    const existing = await this.prisma.labWork.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LabWork with id ${id} not found`);
    }

    await this.prisma.labWork.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return this.findOneWork(id);
  }

  async reorderWorkMedia(labWorkId: string, mediaIds: string[]): Promise<LabWorkMediaDto[]> {
    // Verify all media belong to this work
    const allMedia = await this.prisma.labWorkMedia.findMany({
      where: { labWorkId },
    });

    const providedIds = new Set(mediaIds);
    if (providedIds.size !== mediaIds.length) {
      throw new BadRequestException('Duplicate media IDs provided');
    }

    if (providedIds.size !== allMedia.length) {
      throw new BadRequestException('Media IDs count does not match existing media');
    }

    for (const mediaId of mediaIds) {
      const media = allMedia.find((m) => m.id === mediaId);
      if (!media) {
        throw new BadRequestException(`Media with id ${mediaId} not found for this work`);
      }
    }

    // Update sort order
    await Promise.all(
      mediaIds.map((mediaId, index) =>
        this.prisma.labWorkMedia.update({
          where: { id: mediaId },
          data: { sort: index },
        }),
      ),
    );

    const updated = await this.prisma.labWorkMedia.findMany({
      where: { labWorkId },
      orderBy: { sort: 'asc' },
    });

    return updated.map((m) => ({
      id: m.id,
      labWorkId: m.labWorkId,
      type: m.type as 'IMAGE' | 'VIDEO',
      url: m.url,
      sort: m.sort,
    }));
  }

  // Helper: recalculate rating aggregates from LabWorkRating records
  private async recalcLabWorkRating(labWorkId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx || this.prisma;

    const ratings = await prisma.labWorkRating.findMany({
      where: { labWorkId },
      select: { rating: true },
    });

    const ratingCount = ratings.length;
    const ratingAvg = ratingCount > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : 0;

    await prisma.labWork.update({
      where: { id: labWorkId },
      data: {
        ratingAvg,
        ratingCount,
      },
    });
  }

  async rateLabWork(labWorkId: string, userId: string, ratingDto: RateLabWorkDto): Promise<RateLabWorkResponse> {
    // Validate work exists
    const work = await this.prisma.labWork.findUnique({
      where: { id: labWorkId },
    });

    if (!work) {
      throw new NotFoundException(`LabWork with id ${labWorkId} not found`);
    }

    // Validate rating range (already validated in DTO, but double-check)
    if (ratingDto.rating < 1 || ratingDto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Upsert rating in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Upsert rating (update if exists, create if not)
      await tx.labWorkRating.upsert({
        where: {
          labWorkId_userId: {
            labWorkId,
            userId,
          },
        },
        update: {
          rating: ratingDto.rating,
        },
        create: {
          labWorkId,
          userId,
          rating: ratingDto.rating,
        },
      });

      // Recalculate aggregates
      await this.recalcLabWorkRating(labWorkId, tx);

      // Get updated work with user rating
      const updatedWork = await tx.labWork.findUnique({
        where: { id: labWorkId },
        include: {
          ratings: {
            where: { userId },
            select: { rating: true },
          },
        },
      });

      return updatedWork!;
    });

    return {
      ratingAvg: result.ratingAvg,
      ratingCount: result.ratingCount,
      userRating: result.ratings[0]?.rating ?? null,
    };
  }
}








