import { z } from 'zod';

export const orderItemDtoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  titleSnapshot: z.string(),
  priceSnapshot: z.number(),
  qty: z.number(),
});

export const orderDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED']),
  totalAmount: z.number(),
  currency: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerAddress: z.string().nullable(),
  comment: z.string().nullable(),
  paymentMethod: z.enum(['MANAGER']),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(orderItemDtoSchema),
});

export const orderListItemDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED']),
  totalAmount: z.number(),
  currency: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ordersListResponseSchema = z.object({
  items: z.array(orderListItemDtoSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type OrderDto = z.infer<typeof orderDtoSchema>;
export type OrderListItemDto = z.infer<typeof orderListItemDtoSchema>;
export type OrdersListResponse = z.infer<typeof ordersListResponseSchema>;
