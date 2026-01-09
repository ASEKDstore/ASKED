import { z } from 'zod';

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc']).optional().default('new'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ProductQueryDto = z.infer<typeof productQuerySchema>;




