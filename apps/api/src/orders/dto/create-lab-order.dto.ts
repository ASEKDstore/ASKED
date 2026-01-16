import { z } from 'zod';

export const createLabOrderSchema = z.object({
  clothingType: z.string().nullable(),
  size: z.string().nullable(),
  colorChoice: z.string().nullable(),
  customColor: z.string().nullable(),
  placement: z.string().nullable(),
  description: z.string().min(1),
  attachmentUrl: z.string().url().optional().nullable(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateLabOrderDto = z.infer<typeof createLabOrderSchema>;

