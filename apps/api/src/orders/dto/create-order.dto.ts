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
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type CreateOrderItemDto = z.infer<typeof createOrderItemSchema>;




