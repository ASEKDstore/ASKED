import { z } from 'zod';

export const subscriptionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string().nullable(),
  lastPaidAt: z.string().datetime(),
  periodMonths: z.number().int(),
  remindBeforeDays: z.number().int(),
  nextDueAt: z.string().datetime(),
  lastRemindedAt: z.string().datetime().nullable(),
  lastRemindedForDueAt: z.string().datetime().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SubscriptionDto = z.infer<typeof subscriptionDtoSchema>;
