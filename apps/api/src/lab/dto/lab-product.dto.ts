import { z } from 'zod';

export const labProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type LabProductQueryDto = z.infer<typeof labProductQuerySchema>;

export const createLabProductSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    price: z.number().int().min(0).optional(),
    currency: z.string().default('RUB'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    coverMediaType: z.enum(['IMAGE', 'VIDEO']),
    coverMediaUrl: z.string().url(),
    ctaType: z.enum(['NONE', 'PRODUCT', 'URL']).default('NONE'),
    ctaProductId: z.string().optional(),
    ctaUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      if (data.ctaType === 'PRODUCT') {
        return !!data.ctaProductId && !data.ctaUrl;
      }
      if (data.ctaType === 'URL') {
        return !!data.ctaUrl && !data.ctaProductId;
      }
      return !data.ctaProductId && !data.ctaUrl;
    },
    {
      message: 'CTA validation failed: PRODUCT requires ctaProductId, URL requires ctaUrl, NONE requires neither',
    }
  );

export type CreateLabProductDto = z.infer<typeof createLabProductSchema>;

export const updateLabProductSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  coverMediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  coverMediaUrl: z.string().url().optional(),
  ctaType: z.enum(['NONE', 'PRODUCT', 'URL']).optional(),
  ctaProductId: z.string().optional(),
  ctaUrl: z.string().url().optional(),
});

export type UpdateLabProductDto = z.infer<typeof updateLabProductSchema>;

export interface LabProductDto {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  coverMediaType: 'IMAGE' | 'VIDEO';
  coverMediaUrl: string;
  ctaType: 'NONE' | 'PRODUCT' | 'URL';
  ctaProductId: string | null;
  ctaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  gallery?: LabProductMediaDto[];
}

export interface LabProductMediaDto {
  id: string;
  labProductId: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  sortOrder: number;
  createdAt: string;
}

export interface LabProductsListResponse {
  items: LabProductDto[];
  total: number;
  page: number;
  pageSize: number;
}

export const createLabProductMediaSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url(),
  sortOrder: z.number().int().default(0),
});

export type CreateLabProductMediaDto = z.infer<typeof createLabProductMediaSchema>;

export const updateLabProductMediaSchema = createLabProductMediaSchema.partial();

export type UpdateLabProductMediaDto = z.infer<typeof updateLabProductMediaSchema>;

