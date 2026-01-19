import { z } from 'zod';

export const updatePoziciyaSchema = z.object({
  nazvanie: z.string().min(1).optional(),
  kolichestvo: z.number().int().min(1).optional(),
});

export type UpdatePoziciyaDto = z.infer<typeof updatePoziciyaSchema>;

