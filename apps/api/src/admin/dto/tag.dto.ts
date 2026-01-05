import { z } from 'zod';

export const tagDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export type TagDto = z.infer<typeof tagDtoSchema>;

