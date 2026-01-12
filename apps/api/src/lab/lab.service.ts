import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

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
}







