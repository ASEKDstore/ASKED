import { z } from 'zod';

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED']).optional(),
  search: z.string().optional(), // по телефону/имени
});

export type OrderQueryDto = z.infer<typeof orderQuerySchema>;




