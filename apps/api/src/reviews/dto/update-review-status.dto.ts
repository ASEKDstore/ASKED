import { z } from 'zod';

export const updateReviewStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export type UpdateReviewStatusDto = z.infer<typeof updateReviewStatusSchema>;
