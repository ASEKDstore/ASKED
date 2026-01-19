import { z } from 'zod';

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(), // Filter by rating (1-5)
  withMedia: z.coerce.boolean().optional(), // Filter reviews with media
});

export type ReviewQueryDto = z.infer<typeof reviewQuerySchema>;
