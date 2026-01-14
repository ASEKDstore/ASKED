import { z } from 'zod';

export const reviewMediaDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string(),
  createdAt: z.date(),
});

export const reviewReplyDtoSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  adminId: z.string().nullable(),
  text: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const reviewDtoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  orderId: z.string().nullable(),
  rating: z.number(),
  text: z.string().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  createdAt: z.date(),
  updatedAt: z.date(),
  media: z.array(reviewMediaDtoSchema),
  reply: reviewReplyDtoSchema.nullable().optional(),
  user: z.object({
    id: z.string(),
    username: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    photoUrl: z.string().nullable(),
  }).optional(),
});

export const reviewListItemDtoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  orderId: z.string().nullable(),
  rating: z.number(),
  text: z.string().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  createdAt: z.date(),
  media: z.array(reviewMediaDtoSchema),
  reply: reviewReplyDtoSchema.nullable().optional(),
  user: z.object({
    id: z.string(),
    username: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    photoUrl: z.string().nullable(),
  }),
});

export const reviewsListResponseSchema = z.object({
  items: z.array(reviewListItemDtoSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type ReviewDto = z.infer<typeof reviewDtoSchema>;
export type ReviewListItemDto = z.infer<typeof reviewListItemDtoSchema>;
export type ReviewsListResponse = z.infer<typeof reviewsListResponseSchema>;
export type ReviewMediaDto = z.infer<typeof reviewMediaDtoSchema>;
export type ReviewReplyDto = z.infer<typeof reviewReplyDtoSchema>;

