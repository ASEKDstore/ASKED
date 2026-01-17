import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { MaintenanceResponseDto, UpdateMaintenanceDto } from './dto/maintenance.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaintenanceStatus(): Promise<MaintenanceResponseDto> {
    const settings = await this.prisma.appSettingsSingleton.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        globalMaintenanceEnabled: false,
      },
      update: {},
    });

    return {
      globalMaintenanceEnabled: settings.globalMaintenanceEnabled,
    };
  }

  async updateMaintenanceStatus(dto: UpdateMaintenanceDto): Promise<MaintenanceResponseDto> {
    const settings = await this.prisma.appSettingsSingleton.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        globalMaintenanceEnabled: dto.globalMaintenanceEnabled,
      },
      update: {
        globalMaintenanceEnabled: dto.globalMaintenanceEnabled,
      },
    });

    return {
      globalMaintenanceEnabled: settings.globalMaintenanceEnabled,
    };
  }
}

