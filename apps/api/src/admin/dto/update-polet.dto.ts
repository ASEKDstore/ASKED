import { z } from 'zod';

export const updatePoletSchema = z.object({
  nazvanie: z.string().min(1).optional(),
  cenaPoletaRub: z.number().int().min(0).optional(),
  dostavkaRub: z.number().int().min(0).optional(),
  prochieRashodyRub: z.number().int().min(0).optional(),
  primernoeKolvo: z.number().int().min(1).optional().nullable(),
});

export type UpdatePoletDto = z.infer<typeof updatePoletSchema>;

