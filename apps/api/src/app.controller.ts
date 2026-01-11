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
  getHealth(): { status: string; timestamp: string; apiVersion: string; webVersion?: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      apiVersion: process.env.APP_VERSION || require('../package.json').version,
      webVersion: process.env.WEB_VERSION || undefined,
    };
  }
}






