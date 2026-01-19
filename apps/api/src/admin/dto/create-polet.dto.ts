import { z } from 'zod';

export const createPoletSchema = z.object({
  nazvanie: z.string().min(1, 'Название обязательно'),
  cenaPoleta: z.number().int().min(0, 'Цена полета должна быть >= 0'),
  dostavka: z.number().int().min(0, 'Доставка должна быть >= 0'),
  prochieRashody: z.number().int().min(0).default(0),
  primernoeKolvo: z.number().int().min(1).optional(),
});

export type CreatePoletDto = z.infer<typeof createPoletSchema>;

