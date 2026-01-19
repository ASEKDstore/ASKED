import type { Polet, PoziciyaPoleta } from '@prisma/client';

export interface PoziciyaPoletaDto {
  id: string;
  poletId: string;
  tovarId: string | null;
  artikul: string | null;
  nazvanie: string;
  kolichestvo: number;
  sebestoimostBazovaya: number;
  sebestoimostDostavka: number;
  sebestoimostItogo: number;
  tovar?: {
    id: string;
    title: string;
    price: number;
  } | null;
}

export interface PoletDto {
  id: string;
  nazvanie: string;
  status: 'DRAFT' | 'ACCEPTED' | 'POSTED' | 'CANCELED';
  metodRaspredeleniya: 'BY_QUANTITY' | 'BY_COST';
  stoimostPoleta: number;
  stoimostDostavki: number;
  prochieRashody: number;
  obshayaSummaZatrat: number;
  dataPriemki: Date | null;
  dataProvedeniya: Date | null;
  createdAt: Date;
  updatedAt: Date;
  pozicii: PoziciyaPoletaDto[];
}

export function mapPoletToDto(polet: Polet & { pozicii: (PoziciyaPoleta & { tovar: { id: string; title: string; price: number } | null })[] }): PoletDto {
  return {
    id: polet.id,
    nazvanie: polet.nazvanie,
    status: polet.status,
    metodRaspredeleniya: polet.metodRaspredeleniya,
    stoimostPoleta: polet.stoimostPoleta,
    stoimostDostavki: polet.stoimostDostavki,
    prochieRashody: polet.prochieRashody,
    obshayaSummaZatrat: polet.obshayaSummaZatrat,
    dataPriemki: polet.dataPriemki,
    dataProvedeniya: polet.dataProvedeniya,
    createdAt: polet.createdAt,
    updatedAt: polet.updatedAt,
    pozicii: polet.pozicii.map((poz) => ({
      id: poz.id,
      poletId: poz.poletId,
      tovarId: poz.tovarId,
      artikul: poz.artikul,
      nazvanie: poz.nazvanie,
      kolichestvo: poz.kolichestvo,
      sebestoimostBazovaya: poz.sebestoimostBazovaya,
      sebestoimostDostavka: poz.sebestoimostDostavka,
      sebestoimostItogo: poz.sebestoimostItogo,
      tovar: poz.tovar ? {
        id: poz.tovar.id,
        title: poz.tovar.title,
        price: poz.tovar.price,
      } : null,
    })),
  };
}

