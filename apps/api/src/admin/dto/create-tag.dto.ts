import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export type CreateTagDto = z.infer<typeof createTagSchema>;






