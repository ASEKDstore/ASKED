import { z } from 'zod';

export const updatePoletSchema = z.object({
  nazvanie: z.string().min(1).optional(),
  cenaPoleta: z.number().int().min(0).optional(),
  dostavka: z.number().int().min(0).optional(),
  prochieRashody: z.number().int().min(0).optional(),
  primernoeKolvo: z.number().int().min(1).optional().nullable(),
});

export type UpdatePoletDto = z.infer<typeof updatePoletSchema>;

