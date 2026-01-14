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
      stock: { gt: 0 }, // Exclude out-of-stock products from public catalog
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
      sku: product.sku,
      price: product.price,
      currency: product.currency,
      status: product.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      stock: product.stock,
      averageRating: product.averageRating,
      reviewsCount: product.reviewsCount,
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
      sku: product.sku,
      price: product.price,
      currency: product.currency,
      status: product.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      stock: product.stock,
      averageRating: product.averageRating,
      reviewsCount: product.reviewsCount,
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

  async findSimilar(id: string, limit: number = 8): Promise<ProductListItemDto[]> {
    // Get the product to find similar ones for
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Extract category and tag IDs
    const categoryIds = product.categories.map((pc) => pc.categoryId);
    const tagIds = product.tags.map((pt) => pt.tagId);

    // If product has no categories or tags, return empty array
    if (categoryIds.length === 0 && tagIds.length === 0) {
      return [];
    }

    // Build OR conditions for categories and tags
    const orConditions: any[] = [];
    if (categoryIds.length > 0) {
      orConditions.push({
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      });
    }
    if (tagIds.length > 0) {
      orConditions.push({
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      });
    }

    // Find products that share at least one category OR tag
    const candidateProducts = await this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: id } }, // Exclude current product
          { status: 'ACTIVE' }, // Only active products
          { stock: { gt: 0 } }, // Only in-stock products
          { OR: orConditions },
        ],
      },
      include: {
        images: {
          orderBy: { sort: 'asc' },
          take: 1, // Only first image for card
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

    // Calculate relevance score (number of overlapping categories + tags)
    const scored = candidateProducts.map((p) => {
      const overlapCategories = p.categories.filter((pc) =>
        categoryIds.includes(pc.categoryId),
      ).length;
      const overlapTags = p.tags.filter((pt) => tagIds.includes(pt.tagId)).length;
      const score = overlapCategories + overlapTags;

      return { product: p, score };
    });

    // Sort by score (descending) and take top N
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);

    // Map to DTO format
    return sorted.map(({ product: p }) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      sku: p.sku,
      price: p.price,
      currency: p.currency,
      status: p.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      stock: p.stock,
      averageRating: p.averageRating,
      reviewsCount: p.reviewsCount,
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        sort: img.sort,
      })),
      categories: p.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      tags: p.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    }));
  }
}
