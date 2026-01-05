import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { ProductQueryDto } from './dto/product-query.dto';
import type { ProductDto, ProductListItemDto, ProductsListResponse } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto): Promise<ProductsListResponse> {
    const { q, category, tags, minPrice, maxPrice, sort, page, pageSize } = query;

    const where: any = {
      status: 'ACTIVE',
    };

    // Search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Tags filter
    if (tags) {
      const tagSlugs = tags.split(',').map((t: string) => t.trim());
      where.tags = {
        some: {
          tag: {
            slug: { in: tagSlugs },
          },
        },
      };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Sort
    let orderBy: any = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'new':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Count total
    const total = await this.prisma.product.count({ where });

    // Get items
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: {
          orderBy: { sort: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const items: ProductListItemDto[] = products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      status: product.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      stock: product.stock,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        sort: img.sort,
      })),
      categories: product.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      tags: product.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    }));

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sort: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      status: product.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        sort: img.sort,
      })),
      categories: product.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      tags: product.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    };
  }
}
