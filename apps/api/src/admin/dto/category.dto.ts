import { z } from 'zod';

export const categoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sort: z.number(),
});

export type CategoryDto = z.infer<typeof categoryDtoSchema>;

