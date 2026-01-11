import { z } from 'zod';

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED']).optional(),
  search: z.string().optional(), // по телефону/имени
  includeDeleted: z.coerce.boolean().optional().default(false), // Include soft-deleted orders (admin only)
});

// Type where includeDeleted is optional (for callers), but schema provides default at runtime
export type OrderQueryDto = Omit<z.infer<typeof orderQuerySchema>, 'includeDeleted'> & {
  includeDeleted?: boolean;
};






