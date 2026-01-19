import { z } from 'zod';

export const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export type MarkReadDto = z.infer<typeof markReadSchema>;
