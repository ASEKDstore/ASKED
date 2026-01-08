import { z } from 'zod';

export const appEventSchema = z.object({
  eventType: z.enum(['PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'PURCHASE']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string().optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
  postId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type AppEventDto = z.infer<typeof appEventSchema>;


