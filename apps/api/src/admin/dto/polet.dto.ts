import type { Polet, PoziciyaPoleta } from '@prisma/client';

export interface PoziciyaPoletaDto {
  id: string;
  poletId: string;
  nazvanie: string;
  kolichestvo: number;
  sebestoimostBazovayaRub: number;
  sebestoimostDostavkaRub: number;
  sebestoimostItogoRub: number;
  tovarId: string | null;
  tovar?: {
    id: string;
    title: string;
    price: number;
    stock: number;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    sku: string | null;
    costPrice: number | null;
    deletedAt: Date | null;
  } | null;
}

export interface PoletDto {
  id: string;
  nazvanie: string;
  status: 'DRAFT' | 'RECEIVED' | 'DISASSEMBLED' | 'POSTED' | 'CANCELED';
  cenaPoletaRub: number;
  dostavkaRub: number;
  prochieRashodyRub: number;
  obshayaSummaRub: number;
  metodRaspredeleniya: 'BY_QUANTITY';
  primernoeKolvo: number | null;
  createdAt: Date;
  updatedAt: Date;
  pozicii: PoziciyaPoletaDto[];
}

export function mapPoletToDto(
  polet: Polet & {
    pozicii: (PoziciyaPoleta & {
      tovar: {
        id: string;
        title: string;
        price: number;
        stock: number;
        status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
        sku: string | null;
        costPrice: number | null;
        deletedAt: Date | null;
      } | null;
    })[];
  },
): PoletDto {
  return {
    id: polet.id,
    nazvanie: polet.nazvanie,
    status: polet.status,
    cenaPoletaRub: polet.cenaPoletaRub,
    dostavkaRub: polet.dostavkaRub,
    prochieRashodyRub: polet.prochieRashodyRub,
    obshayaSummaRub: polet.obshayaSummaRub,
    metodRaspredeleniya: polet.metodRaspredeleniya,
    primernoeKolvo: polet.primernoeKolvo,
    createdAt: polet.createdAt,
    updatedAt: polet.updatedAt,
    pozicii: polet.pozicii.map((poz) => ({
      id: poz.id,
      poletId: poz.poletId,
      nazvanie: poz.nazvanie,
      kolichestvo: poz.kolichestvo,
      sebestoimostBazovayaRub: poz.sebestoimostBazovayaRub,
      sebestoimostDostavkaRub: poz.sebestoimostDostavkaRub,
      sebestoimostItogoRub: poz.sebestoimostItogoRub,
      tovarId: poz.tovarId,
      tovar: poz.tovar
        ? {
            id: poz.tovar.id,
            title: poz.tovar.title,
            price: poz.tovar.price,
            stock: poz.tovar.stock,
            status: poz.tovar.status,
            sku: poz.tovar.sku,
            costPrice: poz.tovar.costPrice,
            deletedAt: poz.tovar.deletedAt,
          }
        : null,
    })),
  };
}

