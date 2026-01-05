import { z } from 'zod';

export const userResponseSchema = z.object({
  id: z.string(),
  telegramId: z.string(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  photoUrl: z.string().nullable(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;
