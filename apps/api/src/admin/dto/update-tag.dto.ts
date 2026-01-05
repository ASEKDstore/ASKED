import { z } from 'zod';

export const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

export type UpdateTagDto = z.infer<typeof updateTagSchema>;

