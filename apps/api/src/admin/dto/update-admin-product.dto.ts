import { z } from 'zod';
import { productImageInputSchema } from './create-admin-product.dto';

export const updateAdminProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(productImageInputSchema).optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type UpdateAdminProductDto = z.infer<typeof updateAdminProductSchema>;


