import { Body, Controller, Patch, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { DevAdminAuthGuard } from '../auth/dev-admin-auth.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { updateMaintenanceSchema } from './dto/maintenance.dto';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(DevAdminAuthGuard, TelegramAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch('maintenance')
  async updateMaintenanceStatus(@Body() body: unknown) {
    const dto = updateMaintenanceSchema.parse(body);
    return this.settingsService.updateMaintenanceStatus(dto);
  }
}

