import type { Polet, PoziciyaPoleta } from '@prisma/client';

export interface PoziciyaPoletaDto {
  id: string;
  poletId: string;
  nazvanie: string;
  kolichestvo: number;
  sebestoimostNaEd: number;
  tovarId: string | null;
  tovar?: {
    id: string;
    title: string;
    price: number;
  } | null;
}

export interface PoletDto {
  id: string;
  nazvanie: string;
  status: 'DRAFT' | 'RECEIVED' | 'DISASSEMBLED' | 'POSTED' | 'CANCELED';
  cenaPoleta: number;
  dostavka: number;
  prochieRashody: number;
  obshayaSumma: number;
  metodRaspredeleniya: 'BY_QUANTITY';
  primernoeKolvo: number | null;
  createdAt: Date;
  updatedAt: Date;
  pozicii: PoziciyaPoletaDto[];
}

export function mapPoletToDto(polet: Polet & { pozicii: (PoziciyaPoleta & { tovar: { id: string; title: string; price: number } | null })[] }): PoletDto {
  return {
    id: polet.id,
    nazvanie: polet.nazvanie,
    status: polet.status,
    cenaPoleta: polet.cenaPoleta,
    dostavka: polet.dostavka,
    prochieRashody: polet.prochieRashody,
    obshayaSumma: polet.obshayaSumma,
    metodRaspredeleniya: polet.metodRaspredeleniya,
    primernoeKolvo: polet.primernoeKolvo,
    createdAt: polet.createdAt,
    updatedAt: polet.updatedAt,
    pozicii: polet.pozicii.map((poz) => ({
      id: poz.id,
      poletId: poz.poletId,
      nazvanie: poz.nazvanie,
      kolichestvo: poz.kolichestvo,
      sebestoimostNaEd: poz.sebestoimostNaEd,
      tovarId: poz.tovarId,
      tovar: poz.tovar ? {
        id: poz.tovar.id,
        title: poz.tovar.title,
        price: poz.tovar.price,
      } : null,
    })),
  };
}

