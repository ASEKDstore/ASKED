import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import type { CreatePoletDto } from './dto/create-polet.dto';
import type { UpdatePoletDto } from './dto/update-polet.dto';
import type { CreatePoziciyaDto } from './dto/create-poziciya.dto';
import type { UpdatePoziciyaDto } from './dto/update-poziciya.dto';
import type { PoletDto } from './dto/polet.dto';
import { mapPoletToDto } from './dto/polet.dto';

@Injectable()
export class AdminPoletService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PoletDto[]> {
    const poleti = await this.prisma.polet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return poleti.map(mapPoletToDto);
  }

  async findOne(id: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${id} не найден`);
    }

    return mapPoletToDto(polet);
  }

  async create(dto: CreatePoletDto): Promise<PoletDto> {
    const obshayaSumma = dto.cenaPoleta + dto.dostavka + dto.prochieRashody;

    const polet = await this.prisma.polet.create({
      data: {
        nazvanie: dto.nazvanie,
        cenaPoleta: dto.cenaPoleta,
        dostavka: dto.dostavka,
        prochieRashody: dto.prochieRashody,
        obshayaSumma,
        metodRaspredeleniya: 'BY_QUANTITY',
        primernoeKolvo: dto.primernoeKolvo ?? null,
        status: 'DRAFT',
      },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return mapPoletToDto(polet);
  }

  async update(id: string, dto: UpdatePoletDto): Promise<PoletDto> {
    const existing = await this.prisma.polet.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Полет с ID ${id} не найден`);
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Можно редактировать только полеты со статусом ЧЕРНОВИК');
    }

    const updateData: Prisma.PoletUpdateInput = {};

    if (dto.nazvanie !== undefined) {
      updateData.nazvanie = dto.nazvanie;
    }
    if (dto.cenaPoleta !== undefined) {
      updateData.cenaPoleta = dto.cenaPoleta;
    }
    if (dto.dostavka !== undefined) {
      updateData.dostavka = dto.dostavka;
    }
    if (dto.prochieRashody !== undefined) {
      updateData.prochieRashody = dto.prochieRashody;
    }
    if (dto.primernoeKolvo !== undefined) {
      updateData.primernoeKolvo = dto.primernoeKolvo;
    }

    // Пересчитать общаяСумма
    const cenaPoleta = dto.cenaPoleta ?? existing.cenaPoleta;
    const dostavka = dto.dostavka ?? existing.dostavka;
    const prochieRashody = dto.prochieRashody ?? existing.prochieRashody;
    updateData.obshayaSumma = cenaPoleta + dostavka + prochieRashody;

    const polet = await this.prisma.polet.update({
      where: { id },
      data: updateData,
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return mapPoletToDto(polet);
  }

  async poluchen(poletId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DRAFT') {
      throw new BadRequestException('Можно отметить как ПОЛУЧЕН только полеты со статусом ЧЕРНОВИК');
    }

    const updated = await this.prisma.polet.update({
      where: { id: poletId },
      data: {
        status: 'RECEIVED',
      },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return mapPoletToDto(updated);
  }

  async addPoziciya(poletId: string, dto: CreatePoziciyaDto): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'RECEIVED') {
      throw new BadRequestException('Можно добавлять позиции только в полеты со статусом ПОЛУЧЕН');
    }

    // Рассчитать себестоимость на единицу для всех позиций
    const vsegoEdinits = polet.pozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0) + dto.kolichestvo;
    const sebestoimostNaEd = vsegoEdinits > 0 ? Math.round(polet.obshayaSumma / vsegoEdinits) : 0;

    // Обновить себестоимость всех существующих позиций
    await this.prisma.$transaction(async (tx) => {
      // Добавить новую позицию
      await tx.poziciyaPoleta.create({
        data: {
          poletId,
          nazvanie: dto.nazvanie,
          kolichestvo: dto.kolichestvo,
          sebestoimostNaEd,
        },
      });

      // Обновить себестоимость всех существующих позиций
      if (polet.pozicii.length > 0) {
        await Promise.all(
          polet.pozicii.map((poz) =>
            tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: { sebestoimostNaEd },
            })
          )
        );
      }
    });

    return this.findOne(poletId);
  }

  async updatePoziciya(poletId: string, poziciyaId: string, dto: UpdatePoziciyaDto): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'RECEIVED') {
      throw new BadRequestException('Можно редактировать позиции только в полетах со статусом ПОЛУЧЕН');
    }

    const poziciya = await this.prisma.poziciyaPoleta.findUnique({
      where: { id: poziciyaId },
    });

    if (!poziciya || poziciya.poletId !== poletId) {
      throw new NotFoundException(`Позиция с ID ${poziciyaId} не найдена в полете ${poletId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.PoziciyaPoletaUpdateInput = {};

      if (dto.nazvanie !== undefined) {
        updateData.nazvanie = dto.nazvanie;
      }
      if (dto.kolichestvo !== undefined) {
        updateData.kolichestvo = dto.kolichestvo;
      }

      await tx.poziciyaPoleta.update({
        where: { id: poziciyaId },
        data: updateData,
      });

      // Пересчитать себестоимость для всех позиций
      const updatedPozicii = await tx.poziciyaPoleta.findMany({
        where: { poletId },
      });
      const vsegoEdinits = updatedPozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
      const sebestoimostNaEd = vsegoEdinits > 0 ? Math.round(polet.obshayaSumma / vsegoEdinits) : 0;

      await Promise.all(
        updatedPozicii.map((poz) =>
          tx.poziciyaPoleta.update({
            where: { id: poz.id },
            data: { sebestoimostNaEd },
          })
        )
      );
    });

    return this.findOne(poletId);
  }

  async deletePoziciya(poletId: string, poziciyaId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'RECEIVED') {
      throw new BadRequestException('Можно удалять позиции только в полетах со статусом ПОЛУЧЕН');
    }

    const poziciya = await this.prisma.poziciyaPoleta.findUnique({
      where: { id: poziciyaId },
    });

    if (!poziciya || poziciya.poletId !== poletId) {
      throw new NotFoundException(`Позиция с ID ${poziciyaId} не найдена в полете ${poletId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.poziciyaPoleta.delete({
        where: { id: poziciyaId },
      });

      // Пересчитать себестоимость для оставшихся позиций
      const remainingPozicii = await tx.poziciyaPoleta.findMany({
        where: { poletId },
      });

      if (remainingPozicii.length > 0) {
        const vsegoEdinits = remainingPozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
        const sebestoimostNaEd = vsegoEdinits > 0 ? Math.round(polet.obshayaSumma / vsegoEdinits) : 0;

        await Promise.all(
          remainingPozicii.map((poz) =>
            tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: { sebestoimostNaEd },
            })
          )
        );
      }
    });

    return this.findOne(poletId);
  }

  async razobrat(poletId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'RECEIVED') {
      throw new BadRequestException('Можно разобрать только полеты со статусом ПОЛУЧЕН');
    }

    if (polet.pozicii.length === 0) {
      throw new BadRequestException('Нельзя разобрать полет без позиций');
    }

    const updated = await this.prisma.polet.update({
      where: { id: poletId },
      data: {
        status: 'DISASSEMBLED',
      },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return mapPoletToDto(updated);
  }

  async sozdatTovar(poletId: string, poziciyaId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DISASSEMBLED') {
      throw new BadRequestException('Можно создавать товары только из разобранных полетов');
    }

    const poziciya = await this.prisma.poziciyaPoleta.findUnique({
      where: { id: poziciyaId },
    });

    if (!poziciya || poziciya.poletId !== poletId) {
      throw new NotFoundException(`Позиция с ID ${poziciyaId} не найдена в полете ${poletId}`);
    }

    if (poziciya.tovarId) {
      throw new BadRequestException('Товар для этой позиции уже создан');
    }

    const tovar = await this.prisma.product.create({
      data: {
        title: poziciya.nazvanie,
        price: 0, // Цена будет установлена позже
        costPrice: poziciya.sebestoimostNaEd,
        status: 'DRAFT',
        stock: 0,
        sourcePoletId: poletId,
        sourcePoziciyaId: poziciyaId,
      },
    });

    await this.prisma.poziciyaPoleta.update({
      where: { id: poziciyaId },
      data: { tovarId: tovar.id },
    });

    return this.findOne(poletId);
  }

  async provesti(poletId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: {
        pozicii: {
          include: {
            tovar: true,
          },
        },
      },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DISASSEMBLED') {
      throw new BadRequestException('Можно провести только разобранные полеты');
    }

    const poziciiSTovarom = polet.pozicii.filter((poz) => poz.tovarId && poz.tovar);

    if (poziciiSTovarom.length === 0) {
      throw new BadRequestException('Нет позиций с созданными товарами для проведения');
    }

    // Создать складские партии (InventoryLot) для каждой позиции
    await this.prisma.$transaction(async (tx) => {
      for (const poz of poziciiSTovarom) {
        if (!poz.tovar) {
          continue;
        }

        await tx.inventoryLot.create({
          data: {
            productId: poz.tovar.id,
            unitCost: poz.sebestoimostNaEd,
            qtyReceived: poz.kolichestvo,
            qtyRemaining: poz.kolichestvo,
            receivedAt: new Date(),
            purchaseId: null, // Партии из полетов не связаны с покупками
          },
        });
      }
    });

    // Обновить статус полета
    const updated = await this.prisma.polet.update({
      where: { id: poletId },
      data: {
        status: 'POSTED',
      },
      include: {
        pozicii: {
          include: {
            tovar: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return mapPoletToDto(updated);
  }
}
