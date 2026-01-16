import { z } from 'zod';

export const bannerDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  mediaUrl: z.string().url(),
  isActive: z.boolean(),
  sort: z.number(),
  promoSlug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BannerDto = z.infer<typeof bannerDtoSchema>;

export const createBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  mediaUrl: z.string().url(),
  isActive: z.boolean().optional().default(true),
  sort: z.number().int().min(0).optional().default(0),
  promoSlug: z.string().min(1),
});

export type CreateBannerDto = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  mediaUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().min(0).optional(),
  promoSlug: z.string().min(1).optional(),
});

export type UpdateBannerDto = z.infer<typeof updateBannerSchema>;

export const bannerQuerySchema = z.object({
  q: z.string().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type BannerQueryDto = z.infer<typeof bannerQuerySchema>;









