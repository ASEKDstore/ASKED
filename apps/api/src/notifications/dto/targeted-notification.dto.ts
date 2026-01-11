import { z } from 'zod';

/**
 * Schema for targeted notifications (admin selects specific users)
 */
export const targetedNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.unknown()).optional(),
  recipientTelegramIds: z
    .array(z.union([z.string(), z.number()]))
    .min(1, 'At least one recipient is required')
    .max(500, 'Maximum 500 recipients per request'),
});

export type TargetedNotificationDto = z.infer<typeof targetedNotificationSchema>;

