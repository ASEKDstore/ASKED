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
  media: z.array(promoMediaDtoSchema).optional(),
});

export type PromoDto = z.infer<typeof promoDtoSchema>;

export const createPromoSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  ctaType: z.enum(['PRODUCT', 'URL']).optional().default('URL'),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  media: z
    .array(
      z.object({
        mediaType: z.enum(['IMAGE', 'VIDEO']),
        mediaUrl: z.string().url(),
        sort: z.number().int().min(0).optional().default(0),
      }),
    )
    .optional(),
});

export type CreatePromoDto = z.infer<typeof createPromoSchema>;

export const updatePromoSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  ctaType: z.enum(['PRODUCT', 'URL']).optional(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  media: z
    .array(
      z.object({
        mediaType: z.enum(['IMAGE', 'VIDEO']),
        mediaUrl: z.string().url(),
        sort: z.number().int().min(0).optional().default(0),
      }),
    )
    .optional(),
});

export type UpdatePromoDto = z.infer<typeof updatePromoSchema>;



