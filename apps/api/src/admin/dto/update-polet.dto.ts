import { z } from 'zod';

export const updatePoletSchema = z.object({
  nazvanie: z.string().min(1).optional(),
  metodRaspredeleniya: z.enum(['BY_QUANTITY', 'BY_COST']).optional(),
  stoimostPoleta: z.number().int().min(0).optional(),
  stoimostDostavki: z.number().int().min(0).optional(),
  prochieRashody: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // Если обновляются финансовые поля, пересчитать общаяСуммаЗатрат
    if (data.stoimostPoleta !== undefined || data.stoimostDostavki !== undefined || data.prochieRashody !== undefined) {
      return true;
    }
    return true;
  },
  { message: 'Необходимо указать все финансовые поля для пересчета' }
);

export type UpdatePoletDto = z.infer<typeof updatePoletSchema>;

