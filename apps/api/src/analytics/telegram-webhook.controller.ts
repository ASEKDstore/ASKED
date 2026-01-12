import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { TelegramWebhookService } from './telegram-webhook.service';

@Controller('telegram/webhook')
export class TelegramWebhookController {
  constructor(private readonly telegramWebhookService: TelegramWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any): Promise<{ ok: boolean }> {
    await this.telegramWebhookService.handleUpdate(body);
    return { ok: true };
  }
}







