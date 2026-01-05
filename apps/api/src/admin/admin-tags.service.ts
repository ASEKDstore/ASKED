import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateTagDto } from './dto/create-tag.dto';
import type { TagDto } from './dto/tag.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class AdminTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }

  async findOne(id: string): Promise<TagDto> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  async create(createDto: CreateTagDto): Promise<TagDto> {
    // Check if slug already exists
    const existing = await this.prisma.tag.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tag with slug "${createDto.slug}" already exists`);
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: createDto.name,
        slug: createDto.slug,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  async update(id: string, updateDto: UpdateTagDto): Promise<TagDto> {
    // Check if tag exists
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    // Check if slug is being changed and if new slug already exists
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      const slugExists = await this.prisma.tag.findUnique({
        where: { slug: updateDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(`Tag with slug "${updateDto.slug}" already exists`);
      }
    }

    const tag = await this.prisma.tag.update({
      where: { id },
      data: updateDto,
    });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  async delete(id: string): Promise<void> {
    // Check if tag exists
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        products: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    // Check if tag has products
    if (existing.products.length > 0) {
      throw new ConflictException(
        `Cannot delete tag with id ${id} because it has associated products`,
      );
    }

    await this.prisma.tag.delete({
      where: { id },
    });
  }
}
