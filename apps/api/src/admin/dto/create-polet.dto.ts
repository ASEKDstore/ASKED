import { z } from 'zod';

export const createPoletSchema = z.object({
  nazvanie: z.string().min(1, 'Название обязательно'),
  cenaPoletaRub: z.number().int().min(0, 'Цена паллеты должна быть >= 0 (в рублях)'),
  dostavkaRub: z.number().int().min(0, 'Доставка должна быть >= 0 (в рублях)'),
  prochieRashodyRub: z.number().int().min(0).default(0),
  primernoeKolvo: z.number().int().min(1).optional(),
});

export type CreatePoletDto = z.infer<typeof createPoletSchema>;

