import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(1),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().optional(),
  comment: z.string().optional(),
  items: z.array(createOrderItemSchema).min(1),
  channel: z.enum(['AS', 'LAB']).optional().default('AS'),
  idempotencyKey: z.string().optional(), // Optional idempotency key for retry safety
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type CreateOrderItemDto = z.infer<typeof createOrderItemSchema>;





