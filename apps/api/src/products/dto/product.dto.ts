import { z } from 'zod';

export const productImageDtoSchema = z.object({
  id: z.string(),
  url: z.string(),
  sort: z.number(),
});

export const categoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const tagDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const productDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  stock: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  images: z.array(productImageDtoSchema),
  categories: z.array(categoryDtoSchema),
  tags: z.array(tagDtoSchema),
});

export const productListItemDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  stock: z.number(),
  images: z.array(productImageDtoSchema),
  categories: z.array(categoryDtoSchema),
  tags: z.array(tagDtoSchema),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const productsListResponseSchema = z.object({
  items: z.array(productListItemDtoSchema),
  meta: paginationMetaSchema,
});

export type ProductDto = z.infer<typeof productDtoSchema>;
export type ProductListItemDto = z.infer<typeof productListItemDtoSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type ProductsListResponse = z.infer<typeof productsListResponseSchema>;





