import { z } from 'zod';

export const productImageInputSchema = z.object({
  url: z.string().url(),
  sort: z.number().int().min(0).default(0),
});

export const createAdminProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0),
  currency: z.string().default('RUB'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  stock: z.number().int().min(0).default(0),
  images: z.array(productImageInputSchema).optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type CreateAdminProductDto = z.infer<typeof createAdminProductSchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
