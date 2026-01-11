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

/**
 * Schema for admin broadcast notifications (type is auto-set to ADMIN_BROADCAST)
 */
export const adminBroadcastNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

export type AdminBroadcastNotificationDto = z.infer<typeof adminBroadcastNotificationSchema>;

/**
 * Schema for admin direct notifications (type is auto-set to ADMIN_DIRECT)
 */
export const adminDirectNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

export type AdminDirectNotificationDto = z.infer<typeof adminDirectNotificationSchema>;

