import { z } from 'zod';

export const updatePoziciyaSchema = z.object({
  artikul: z.string().optional(),
  nazvanie: z.string().min(1).optional(),
  kolichestvo: z.number().int().min(1).optional(),
  sebestoimostBazovaya: z.number().int().min(0).optional(),
});

export type UpdatePoziciyaDto = z.infer<typeof updatePoziciyaSchema>;

