import { z } from 'zod';

export const labWorkMediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);

export const labWorkStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const labWorkMediaSchema = z.object({
  id: z.string(),
  labWorkId: z.string(),
  type: labWorkMediaTypeSchema,
  url: z.string(),
  sort: z.number().int().default(0),
});

export const labWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable(),
  description: z.string().nullable(),
  coverUrl: z.string().nullable(),
  ratingAvg: z.number().default(0),
  ratingCount: z.number().int().default(0),
  status: labWorkStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  media: z.array(labWorkMediaSchema).default([]),
});

export const createLabWorkSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  ratingAvg: z.number().min(0).max(5).optional().default(0),
  ratingCount: z.number().int().min(0).optional().default(0),
  status: labWorkStatusSchema.optional().default('DRAFT'),
});

export const updateLabWorkSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  ratingAvg: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).optional(),
  status: labWorkStatusSchema.optional(),
});

export const createLabWorkMediaSchema = z.object({
  type: labWorkMediaTypeSchema,
  url: z.string().url(),
  sort: z.number().int().default(0),
});

export const updateLabWorkMediaSchema = z.object({
  type: labWorkMediaTypeSchema.optional(),
  url: z.string().url().optional(),
  sort: z.number().int().optional(),
});

export const labWorkQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  status: labWorkStatusSchema.optional(),
});

export type LabWorkDto = z.infer<typeof labWorkSchema>;
export type LabWorkMediaDto = z.infer<typeof labWorkMediaSchema>;
export type CreateLabWorkDto = z.infer<typeof createLabWorkSchema>;
export type UpdateLabWorkDto = z.infer<typeof updateLabWorkSchema>;
export type CreateLabWorkMediaDto = z.infer<typeof createLabWorkMediaSchema>;
export type UpdateLabWorkMediaDto = z.infer<typeof updateLabWorkMediaSchema>;
export type LabWorkQueryDto = z.infer<typeof labWorkQuerySchema>;

export const rateLabWorkSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export interface LabWorksListResponse {
  items: LabWorkDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RateLabWorkResponse {
  ratingAvg: number;
  ratingCount: number;
  userRating: number | null;
}

export type RateLabWorkDto = z.infer<typeof rateLabWorkSchema>;
