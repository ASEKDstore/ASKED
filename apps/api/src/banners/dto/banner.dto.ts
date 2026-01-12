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








