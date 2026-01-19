import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly logger = new Logger(AdminPoletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PoletDto[]> {
    try {
      this.logger.log('findAll() - Querying polet table');
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

      this.logger.log(`findAll() - Found ${poleti.length} poleti`);
      return poleti.map(mapPoletToDto);
    } catch (error) {
      this.logger.error('findAll() - Error:', error instanceof Error ? error.stack : error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2021' || error.code === '42P01') {
          // Table does not exist
          this.logger.error('findAll() - Table "polet" does not exist. Migration may not be applied.');
          throw new BadRequestException('Таблица паллет не найдена. Необходимо применить миграцию базы данных.');
        }
      }
      throw error;
    }
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
    const obshayaSummaRub = dto.cenaPoletaRub + dto.dostavkaRub + dto.prochieRashodyRub;

    const polet = await this.prisma.polet.create({
      data: {
        nazvanie: dto.nazvanie,
        cenaPoletaRub: dto.cenaPoletaRub,
        dostavkaRub: dto.dostavkaRub,
        prochieRashodyRub: dto.prochieRashodyRub,
        obshayaSummaRub,
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
    if (dto.cenaPoletaRub !== undefined) {
      updateData.cenaPoletaRub = dto.cenaPoletaRub;
    }
    if (dto.dostavkaRub !== undefined) {
      updateData.dostavkaRub = dto.dostavkaRub;
    }
    if (dto.prochieRashodyRub !== undefined) {
      updateData.prochieRashodyRub = dto.prochieRashodyRub;
    }
    if (dto.primernoeKolvo !== undefined) {
      updateData.primernoeKolvo = dto.primernoeKolvo;
    }

    // Пересчитать общаяСуммаRub
    const cenaPoletaRub = dto.cenaPoletaRub ?? existing.cenaPoletaRub;
    const dostavkaRub = dto.dostavkaRub ?? existing.dostavkaRub;
    const prochieRashodyRub = dto.prochieRashodyRub ?? existing.prochieRashodyRub;
    updateData.obshayaSummaRub = cenaPoletaRub + dostavkaRub + prochieRashodyRub;

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

  /**
   * Распределение доставки ПО_КОЛИЧЕСТВУ с остатком
   * Распределяет доставкуRub + прочиеРасходыRub между позициями пропорционально количеству
   */
  private calculateDeliveryDistribution(
    pozicii: Array<{ id: string; kolichestvo: number }>,
    dostavkaRub: number,
    prochieRashodyRub: number,
  ): Map<string, { sebestoimostDostavkaRub: number }> {
    const totalDeliveryRub = dostavkaRub + prochieRashodyRub;
    const totalQty = pozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);

    if (totalQty === 0) {
      return new Map();
    }

    // Базовая себестоимость доставки на единицу (целая часть)
    const basePerUnit = Math.floor(totalDeliveryRub / totalQty);
    // Остаток для распределения
    let remainder = totalDeliveryRub % totalQty;

    const result = new Map<string, { sebestoimostDostavkaRub: number }>();

    // Распределяем базовую часть и остаток
    for (const poz of pozicii) {
      let sebestoimostDostavkaRub = basePerUnit * poz.kolichestvo;

      // Распределяем остаток по единицам (детерминированно)
      if (remainder > 0) {
        const unitsToAdd = Math.min(remainder, poz.kolichestvo);
        sebestoimostDostavkaRub += unitsToAdd;
        remainder -= unitsToAdd;
      }

      result.set(poz.id, { sebestoimostDostavkaRub });
    }

    return result;
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

    // Рассчитать распределение доставки для всех позиций (включая новую)
    const allPozicii = [
      ...polet.pozicii.map((poz) => ({ id: poz.id, kolichestvo: poz.kolichestvo })),
      { id: 'NEW', kolichestvo: dto.kolichestvo },
    ];

    const deliveryDistribution = this.calculateDeliveryDistribution(
      allPozicii,
      polet.dostavkaRub,
      polet.prochieRashodyRub,
    );

    // Базовая себестоимость = цена паллеты / общее количество
    const totalQty = allPozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
    const sebestoimostBazovayaRub = totalQty > 0 ? Math.floor(polet.cenaPoletaRub / totalQty) : 0;

    await this.prisma.$transaction(async (tx) => {
      // Добавить новую позицию
      await tx.poziciyaPoleta.create({
        data: {
          poletId,
          nazvanie: dto.nazvanie,
          kolichestvo: dto.kolichestvo,
          sebestoimostBazovayaRub,
          sebestoimostDostavkaRub: deliveryDistribution.get('NEW')?.sebestoimostDostavkaRub ?? 0,
          sebestoimostItogoRub: sebestoimostBazovayaRub + (deliveryDistribution.get('NEW')?.sebestoimostDostavkaRub ?? 0),
        },
      });

      // Обновить себестоимость всех существующих позиций
      if (polet.pozicii.length > 0) {
        await Promise.all(
          polet.pozicii.map((poz) => {
            const dist = deliveryDistribution.get(poz.id);
            const sebestoimostDostavkaRub = dist?.sebestoimostDostavkaRub ?? 0;
            const sebestoimostItogoRub = sebestoimostBazovayaRub + sebestoimostDostavkaRub;

            return tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: {
                sebestoimostBazovayaRub,
                sebestoimostDostavkaRub,
                sebestoimostItogoRub,
              },
            });
          })
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

      const deliveryDistribution = this.calculateDeliveryDistribution(
        updatedPozicii.map((poz) => ({ id: poz.id, kolichestvo: poz.kolichestvo })),
        polet.dostavkaRub,
        polet.prochieRashodyRub,
      );

      const totalQty = updatedPozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
      const sebestoimostBazovayaRub = totalQty > 0 ? Math.floor(polet.cenaPoletaRub / totalQty) : 0;

      await Promise.all(
        updatedPozicii.map((poz) => {
          const dist = deliveryDistribution.get(poz.id);
          const sebestoimostDostavkaRub = dist?.sebestoimostDostavkaRub ?? 0;
          const sebestoimostItogoRub = sebestoimostBazovayaRub + sebestoimostDostavkaRub;

          return tx.poziciyaPoleta.update({
            where: { id: poz.id },
            data: {
              sebestoimostBazovayaRub,
              sebestoimostDostavkaRub,
              sebestoimostItogoRub,
            },
          });
        })
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
        const deliveryDistribution = this.calculateDeliveryDistribution(
          remainingPozicii.map((poz) => ({ id: poz.id, kolichestvo: poz.kolichestvo })),
          polet.dostavkaRub,
          polet.prochieRashodyRub,
        );

        const totalQty = remainingPozicii.reduce((sum, poz) => sum + poz.kolichestvo, 0);
        const sebestoimostBazovayaRub = totalQty > 0 ? Math.floor(polet.cenaPoletaRub / totalQty) : 0;

        await Promise.all(
          remainingPozicii.map((poz) => {
            const dist = deliveryDistribution.get(poz.id);
            const sebestoimostDostavkaRub = dist?.sebestoimostDostavkaRub ?? 0;
            const sebestoimostItogoRub = sebestoimostBazovayaRub + sebestoimostDostavkaRub;

            return tx.poziciyaPoleta.update({
              where: { id: poz.id },
              data: {
                sebestoimostBazovayaRub,
                sebestoimostDostavkaRub,
                sebestoimostItogoRub,
              },
            });
          })
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

    // Конвертируем RUB в копейки для costPrice (Warehouse использует копейки)
    const costPriceInCents = poziciya.sebestoimostItogoRub * 100;

    const tovar = await this.prisma.product.create({
      data: {
        title: poziciya.nazvanie,
        price: 0, // Цена будет установлена позже
        costPrice: costPriceInCents,
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

        // Конвертируем RUB в копейки для unitCost (Warehouse использует копейки)
        const unitCostInCents = poz.sebestoimostItogoRub * 100;

        await tx.inventoryLot.create({
          data: {
            productId: poz.tovar.id,
            unitCost: unitCostInCents,
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
