import { z } from 'zod';
import { productListItemDtoSchema } from '../../products/dto/product.dto';

export const adminProductsListResponseSchema = z.object({
  items: z.array(productListItemDtoSchema.extend({
    createdAt: z.date(),
    updatedAt: z.date(),
  })),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type AdminProductsListResponse = z.infer<typeof adminProductsListResponseSchema>;

