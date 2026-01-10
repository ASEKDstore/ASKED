import { z } from 'zod';

export const updateSubscriptionSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  lastPaidAt: z.string().datetime().optional(),
  periodMonths: z.number().int().positive().optional(),
  remindBeforeDays: z.number().int().min(0).max(30).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;

