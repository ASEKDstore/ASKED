import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

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
    const { q, status, page, pageSize, includeDeleted } = query;

    const where: any = {};

    // Filter deleted products by default
    if (!includeDeleted) {
      where.deletedAt = null;
    }

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
      averageRating: product.averageRating,
      reviewsCount: product.reviewsCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        sort: img.sort,
      })),
      sku: product.sku,
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

  async findOne(id: string, includeDeleted = false): Promise<ProductDto> {
    const where: any = { id };
    
    // Filter deleted products by default
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const product = await this.prisma.product.findFirst({
      where,
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

  async create(createDto: CreateAdminProductDto): Promise<ProductDto> {
    const { images, categoryIds, tagIds, sku, ...productData } = createDto;

    // Prepare product data with SKU validation
    let finalSku: string | null = null;
    if (sku) {
      const trimmedSku = sku.trim();
      if (trimmedSku.length > 0) {
        const existing = await this.prisma.product.findUnique({
          where: { sku: trimmedSku },
        });
        if (existing) {
          throw new ConflictException(`Product with SKU "${trimmedSku}" already exists`);
        }
        finalSku = trimmedSku;
      }
    }

    const product = await this.prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          ...productData,
          sku: finalSku,
        },
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
    // Check if product exists (allow deleted products to be updated for recovery)
    const existing = await this.prisma.product.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const { images, categoryIds, tagIds, sku, ...productData } = updateDto;

    // Prepare SKU update if provided
    let finalSku: string | null | undefined = undefined;
    if (sku !== undefined) {
      if (sku && sku.trim().length > 0) {
        const trimmedSku = sku.trim();
        const existingWithSku = await this.prisma.product.findUnique({
          where: { sku: trimmedSku },
        });
        if (existingWithSku && existingWithSku.id !== id) {
          throw new ConflictException(`Product with SKU "${trimmedSku}" already exists`);
        }
        finalSku = trimmedSku;
      } else {
        finalSku = null;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Update product - only include fields that are provided
      const updateData: any = {};
      
      // Only update fields that are explicitly provided
      if (productData.title !== undefined) updateData.title = productData.title;
      if (productData.description !== undefined) updateData.description = productData.description;
      if (productData.price !== undefined) updateData.price = productData.price;
      if (productData.costPrice !== undefined) updateData.costPrice = productData.costPrice;
      if (productData.packagingCost !== undefined) updateData.packagingCost = productData.packagingCost;
      if (productData.currency !== undefined) updateData.currency = productData.currency;
      if (productData.status !== undefined) updateData.status = productData.status;
      if (productData.stock !== undefined) updateData.stock = productData.stock;
      
      if (finalSku !== undefined) {
        updateData.sku = finalSku;
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await tx.product.update({
          where: { id },
          data: updateData,
        });
      }

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
      include: {
        orderItems: { take: 1 },
        inventoryMovements: { take: 1 },
        InventoryLot: { take: 1 },
        reviews: { take: 1 },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Check if product has relations that prevent deletion
    const hasOrders = existing.orderItems.length > 0;
    const hasMovements = existing.inventoryMovements.length > 0;
    const hasLots = existing.InventoryLot.length > 0;
    const hasReviews = existing.reviews.length > 0;

    // Always use soft delete for safety
    // Set deletedAt and status to ARCHIVED
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });

    // Return full product with relations
    const deleted = await this.findOne(id, true); // includeDeleted = true to get the deleted product

    // Return message in response (will be handled by controller if needed)
    return deleted;
  }
}
