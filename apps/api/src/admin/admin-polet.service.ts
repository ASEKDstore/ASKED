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
    const obshayaSummaZatrat = dto.stoimostPoleta + dto.stoimostDostavki + dto.prochieRashody;

    const polet = await this.prisma.polet.create({
      data: {
        nazvanie: dto.nazvanie,
        metodRaspredeleniya: dto.metodRaspredeleniya,
        stoimostPoleta: dto.stoimostPoleta,
        stoimostDostavki: dto.stoimostDostavki,
        prochieRashody: dto.prochieRashody,
        obshayaSummaZatrat,
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
    if (dto.metodRaspredeleniya !== undefined) {
      updateData.metodRaspredeleniya = dto.metodRaspredeleniya;
    }
    if (dto.stoimostPoleta !== undefined) {
      updateData.stoimostPoleta = dto.stoimostPoleta;
    }
    if (dto.stoimostDostavki !== undefined) {
      updateData.stoimostDostavki = dto.stoimostDostavki;
    }
    if (dto.prochieRashody !== undefined) {
      updateData.prochieRashody = dto.prochieRashody;
    }

    // Пересчитать общаяСуммаЗатрат
    const stoimostPoleta = dto.stoimostPoleta ?? existing.stoimostPoleta;
    const stoimostDostavki = dto.stoimostDostavki ?? existing.stoimostDostavki;
    const prochieRashody = dto.prochieRashody ?? existing.prochieRashody;
    updateData.obshayaSummaZatrat = stoimostPoleta + stoimostDostavki + prochieRashody;

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

  async addPoziciya(poletId: string, dto: CreatePoziciyaDto): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DRAFT') {
      throw new BadRequestException('Можно добавлять позиции только в полеты со статусом ЧЕРНОВИК');
    }

    await this.prisma.poziciyaPoleta.create({
      data: {
        poletId,
        artikul: dto.artikul,
        nazvanie: dto.nazvanie,
        kolichestvo: dto.kolichestvo,
        sebestoimostBazovaya: dto.sebestoimostBazovaya,
        sebestoimostDostavka: 0,
        sebestoimostItogo: dto.sebestoimostBazovaya,
      },
    });

    return this.findOne(poletId);
  }

  async updatePoziciya(poletId: string, poziciyaId: string, dto: UpdatePoziciyaDto): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DRAFT') {
      throw new BadRequestException('Можно редактировать позиции только в полетах со статусом ЧЕРНОВИК');
    }

    const poziciya = await this.prisma.poziciyaPoleta.findUnique({
      where: { id: poziciyaId },
    });

    if (!poziciya || poziciya.poletId !== poletId) {
      throw new NotFoundException(`Позиция с ID ${poziciyaId} не найдена в полете ${poletId}`);
    }

    const updateData: Prisma.PoziciyaPoletaUpdateInput = {};

    if (dto.artikul !== undefined) {
      updateData.artikul = dto.artikul;
    }
    if (dto.nazvanie !== undefined) {
      updateData.nazvanie = dto.nazvanie;
    }
    if (dto.kolichestvo !== undefined) {
      updateData.kolichestvo = dto.kolichestvo;
    }
    if (dto.sebestoimostBazovaya !== undefined) {
      updateData.sebestoimostBazovaya = dto.sebestoimostBazovaya;
      // Пересчитать итого (без доставки, т.к. она рассчитывается при принятии)
      updateData.sebestoimostItogo = dto.sebestoimostBazovaya + poziciya.sebestoimostDostavka;
    }

    await this.prisma.poziciyaPoleta.update({
      where: { id: poziciyaId },
      data: updateData,
    });

    return this.findOne(poletId);
  }

  async deletePoziciya(poletId: string, poziciyaId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DRAFT') {
      throw new BadRequestException('Можно удалять позиции только в полетах со статусом ЧЕРНОВИК');
    }

    const poziciya = await this.prisma.poziciyaPoleta.findUnique({
      where: { id: poziciyaId },
    });

    if (!poziciya || poziciya.poletId !== poletId) {
      throw new NotFoundException(`Позиция с ID ${poziciyaId} не найдена в полете ${poletId}`);
    }

    await this.prisma.poziciyaPoleta.delete({
      where: { id: poziciyaId },
    });

    return this.findOne(poletId);
  }

  async prinyat(poletId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'DRAFT') {
      throw new BadRequestException('Можно принять только полеты со статусом ЧЕРНОВИК');
    }

    if (polet.pozicii.length === 0) {
      throw new BadRequestException('Нельзя принять полет без позиций');
    }

    // Рассчитать распределение доставки
    const obshayaDostavka = polet.stoimostDostavki + polet.prochieRashody;

    await this.prisma.$transaction(async (tx) => {
      if (polet.metodRaspredeleniya === 'BY_QUANTITY') {
        // Метод ПО_КОЛИЧЕСТВУ
        const vsegoEdinits = polet.pozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
        const dostavkaNaEdinitsu = Math.round(obshayaDostavka / vsegoEdinits);

        await Promise.all(
          polet.pozicii.map((poz) =>
            tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: {
                sebestoimostDostavka: dostavkaNaEdinitsu,
                sebestoimostItogo: poz.sebestoimostBazovaya + dostavkaNaEdinitsu,
              },
            })
          )
        );
      } else {
        // Метод ПО_СТОИМОСТИ
        const obshayaBazovayaStoimost = polet.pozicii.reduce(
          (sum, poz) => sum + poz.kolichestvo * poz.sebestoimostBazovaya,
          0
        );

        await Promise.all(
          polet.pozicii.map((poz) => {
            const bazovayaStoimostPozicii = poz.kolichestvo * poz.sebestoimostBazovaya;
            const dolyPozicii = obshayaBazovayaStoimost > 0 ? bazovayaStoimostPozicii / obshayaBazovayaStoimost : 0;
            const dostavkaPozicii = Math.round(dolyPozicii * obshayaDostavka);
            const dostavkaNaEdinitsu = Math.round(dostavkaPozicii / poz.kolichestvo);

            return tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: {
                sebestoimostDostavka: dostavkaNaEdinitsu,
                sebestoimostItogo: poz.sebestoimostBazovaya + dostavkaNaEdinitsu,
              },
            });
          })
        );
      }
    });

    // Обновить статус полета
    const updated = await this.prisma.polet.update({
      where: { id: poletId },
      data: {
        status: 'ACCEPTED',
        dataPriemki: new Date(),
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

  async sozdanieTovarov(poletId: string): Promise<PoletDto> {
    const polet = await this.prisma.polet.findUnique({
      where: { id: poletId },
      include: { pozicii: true },
    });

    if (!polet) {
      throw new NotFoundException(`Полет с ID ${poletId} не найден`);
    }

    if (polet.status !== 'ACCEPTED') {
      throw new BadRequestException('Можно создавать товары только из принятых полетов');
    }

    // Создать товары для позиций без товара
    const poziciiBezTovara = polet.pozicii.filter((poz) => !poz.tovarId);

    if (poziciiBezTovara.length === 0) {
      throw new BadRequestException('Все позиции уже имеют связанные товары');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const poz of poziciiBezTovara) {
        const tovar = await tx.product.create({
          data: {
            title: poz.nazvanie,
            sku: poz.artikul || undefined,
            price: 0, // Цена будет установлена позже
            costPrice: poz.sebestoimostItogo,
            status: 'DRAFT',
            stock: 0,
            sourcePoletId: poletId,
            sourcePoziciyaId: poz.id,
          },
        });

        await tx.poziciyaPoleta.update({
          where: { id: poz.id },
          data: { tovarId: tovar.id },
        });
      }
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

    if (polet.status !== 'ACCEPTED') {
      throw new BadRequestException('Можно провести только принятые полеты');
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
            unitCost: poz.sebestoimostItogo,
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
        dataProvedeniya: new Date(),
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

