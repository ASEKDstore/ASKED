import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CategoryDto } from './dto/category.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryDto[]> {
    // Sort by id desc (cuid contains timestamp, newer records have larger ids)
    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'desc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      sort: cat.sort,
    }));
  }

  async findOne(id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort: category.sort,
    };
  }

  async create(createDto: CreateCategoryDto): Promise<CategoryDto> {
    // Check if slug already exists
    const existing = await this.prisma.category.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${createDto.slug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: createDto.name,
        slug: createDto.slug,
        sort: createDto.sort ?? 0,
      },
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort: category.sort,
    };
  }

  async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryDto> {
    // Check if category exists
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // Check if slug is being changed and if new slug already exists
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: updateDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(`Category with slug "${updateDto.slug}" already exists`);
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateDto,
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort: category.sort,
    };
  }

  async delete(id: string): Promise<void> {
    // Check if category exists
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // Check if category has products
    if (existing.products.length > 0) {
      throw new ConflictException(
        `Cannot delete category with id ${id} because it has associated products`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
