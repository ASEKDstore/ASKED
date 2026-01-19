import { z } from 'zod';

export const createPoziciyaSchema = z.object({
  artikul: z.string().optional(),
  nazvanie: z.string().min(1, 'Название обязательно'),
  kolichestvo: z.number().int().min(1, 'Количество должно быть >= 1'),
  sebestoimostBazovaya: z.number().int().min(0, 'Базовая себестоимость должна быть >= 0'),
});

export type CreatePoziciyaDto = z.infer<typeof createPoziciyaSchema>;

