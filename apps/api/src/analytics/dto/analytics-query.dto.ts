import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;

export const telegramPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type TelegramPostsQueryDto = z.infer<typeof telegramPostsQuerySchema>;

export const shopProductsQuerySchema = z.object({
  metric: z.enum(['orders', 'revenue', 'views']).default('orders'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type ShopProductsQueryDto = z.infer<typeof shopProductsQuerySchema>;

export const funnelQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type FunnelQueryDto = z.infer<typeof funnelQuerySchema>;


