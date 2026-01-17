import { z } from 'zod';

export const maintenanceResponseSchema = z.object({
  globalMaintenanceEnabled: z.boolean(),
});

export type MaintenanceResponseDto = z.infer<typeof maintenanceResponseSchema>;

export const updateMaintenanceSchema = z.object({
  globalMaintenanceEnabled: z.boolean(),
});

export type UpdateMaintenanceDto = z.infer<typeof updateMaintenanceSchema>;

