import { z } from 'zod';

export const createPoletSchema = z.object({
  nazvanie: z.string().min(1, 'Название обязательно'),
  metodRaspredeleniya: z.enum(['BY_QUANTITY', 'BY_COST']).default('BY_QUANTITY'),
  stoimostPoleta: z.number().int().min(0, 'Стоимость полета должна быть >= 0'),
  stoimostDostavki: z.number().int().min(0, 'Стоимость доставки должна быть >= 0'),
  prochieRashody: z.number().int().min(0).default(0),
});

export type CreatePoletDto = z.infer<typeof createPoletSchema>;

