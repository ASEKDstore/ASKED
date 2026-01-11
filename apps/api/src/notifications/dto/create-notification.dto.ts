import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.enum(['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ADMIN_BROADCAST', 'ADMIN_DIRECT']),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  target: z.enum(['ALL', 'USER', 'SEGMENT']).default('ALL'),
  userId: z.string().optional(), // Required if target is USER
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

