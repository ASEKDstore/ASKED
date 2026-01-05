import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED']),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;



