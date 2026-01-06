import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { ProductDto } from '../products/dto/product.dto';

import type { AdminProductsListResponse } from './dto/admin-product-list-response.dto';
import type { AdminProductQueryDto } from './dto/admin-product-query.dto';
import type { CreateAdminProductDto } from './dto/create-admin-product.dto';
import type { UpdateAdminProductDto } from './dto/update-admin-product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminProductQueryDto): Promise<AdminProductsListResponse> {
    const { q, status, page, pageSize } = query;

    const where: any = {};

    // Search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Count total
    const total = await this.prisma.product.count({ where });

    // Get items (sorted by createdAt desc - newest first)
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    const items = products.map((product) => ({
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
    }));

    return {
      items,
      total,
      page,
      pageSize,
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

  async create(createDto: CreateAdminProductDto): Promise<ProductDto> {
    const { images, categoryIds, tagIds, ...productData } = createDto;

    const product = await this.prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: productData,
      });

      // Create images
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img) => ({
            productId: product.id,
            url: img.url,
            sort: img.sort,
          })),
        });
      }

      // Create category relations
      if (categoryIds && categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        });
      }

      // Create tag relations
      if (tagIds && tagIds.length > 0) {
        await tx.productTag.createMany({
          data: tagIds.map((tagId) => ({
            productId: product.id,
            tagId,
          })),
        });
      }

      return product.id;
    });

    // Return full product with relations (outside transaction)
    return this.findOne(product);
  }

  async update(id: string, updateDto: UpdateAdminProductDto): Promise<ProductDto> {
    // Check if product exists
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const { images, categoryIds, tagIds, ...productData } = updateDto;

    await this.prisma.$transaction(async (tx) => {
      // Update product
      await tx.product.update({
        where: { id },
        data: productData,
      });

      // Replace images (delete old, create new)
      if (images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              productId: id,
              url: img.url,
              sort: img.sort,
            })),
          });
        }
      }

      // Replace category relations
      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });

        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
          });
        }
      }

      // Replace tag relations
      if (tagIds !== undefined) {
        await tx.productTag.deleteMany({
          where: { productId: id },
        });

        if (tagIds.length > 0) {
          await tx.productTag.createMany({
            data: tagIds.map((tagId) => ({
              productId: id,
              tagId,
            })),
          });
        }
      }
    });

    // Return full product with relations (outside transaction)
    return this.findOne(id);
  }

  async delete(id: string): Promise<ProductDto> {
    // Check if product exists
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Soft delete: set status to ARCHIVED (updatedAt will be automatically updated by Prisma @updatedAt)
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    // Return full product with relations
    return this.findOne(id);
  }
}
