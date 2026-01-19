import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string().optional().nullable(),
  lastPaidAt: z.string().datetime('lastPaidAt must be a valid ISO datetime'),
  periodMonths: z.number().int().positive().default(1),
  remindBeforeDays: z.number().int().min(0).max(30).default(1),
  isActive: z.boolean().default(true),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
