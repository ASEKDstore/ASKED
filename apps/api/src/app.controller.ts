import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): {
    status: string;
    timestamp: string;
    apiVersion: string;
    webVersion?: string;
    gitCommit?: string;
  } {
    // Read version from package.json (single source of truth)
    // Fallback to env variable if package.json read fails
    let apiVersion: string;
    if (process.env.APP_VERSION) {
      apiVersion = process.env.APP_VERSION;
    } else {
      try {
        apiVersion = require('../package.json').version;
      } catch {
        apiVersion = 'unknown';
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      apiVersion,
      webVersion: process.env.WEB_VERSION || undefined,
      gitCommit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || undefined,
    };
  }
}






