import { z } from 'zod';

export const createReviewMediaSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url(),
});

export const createReviewSchema = z.object({
  productId: z.string(),
  orderId: z.string().optional(), // Optional, for verified purchase
  rating: z.number().int().min(1).max(5),
  text: z.string().optional(),
  media: z.array(createReviewMediaSchema).max(5).optional(), // Max 5 media files
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type CreateReviewMediaDto = z.infer<typeof createReviewMediaSchema>;
