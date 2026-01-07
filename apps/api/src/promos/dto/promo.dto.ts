import { z } from 'zod';

export const promoMediaDtoSchema = z.object({
  id: z.string(),
  promoId: z.string(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  mediaUrl: z.string().url(),
  sort: z.number(),
});

export type PromoMediaDto = z.infer<typeof promoMediaDtoSchema>;

export const promoDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  ctaType: z.enum(['PRODUCT', 'URL']),
  ctaText: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  media: z.array(promoMediaDtoSchema),
});

export type PromoDto = z.infer<typeof promoDtoSchema>;


