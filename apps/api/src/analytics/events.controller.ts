import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AppEventsService } from './app-events.service';
import { appEventSchema } from './dto/app-event.dto';

@Controller('public/events')
export class EventsController {
  constructor(private readonly appEventsService: AppEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() body: any): Promise<{ success: boolean }> {
    const eventDto = appEventSchema.parse(body);
    await this.appEventsService.createEvent(eventDto);
    return { success: true };
  }
}








