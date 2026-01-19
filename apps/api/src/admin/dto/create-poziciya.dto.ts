import { z } from 'zod';

export const createPoziciyaSchema = z.object({
  nazvanie: z.string().min(1, 'Название обязательно'),
  kolichestvo: z.number().int().min(1, 'Количество должно быть >= 1'),
});

export type CreatePoziciyaDto = z.infer<typeof createPoziciyaSchema>;

