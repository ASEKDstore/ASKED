import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sort: z.number().int().min(0).optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;


