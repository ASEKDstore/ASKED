import { z } from 'zod';

export const adminProductQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export type AdminProductQueryDto = z.infer<typeof adminProductQuerySchema>;


