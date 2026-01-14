import { z } from 'zod';

export const createReviewReplySchema = z.object({
  text: z.string().min(1, 'Reply text is required').max(2000, 'Reply text must be less than 2000 characters'),
});

export type CreateReviewReplyDto = z.infer<typeof createReviewReplySchema>;

