import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { AppEventDto } from './dto/app-event.dto';

@Injectable()
export class AppEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(eventDto: AppEventDto): Promise<void> {
    await this.prisma.appEvent.create({
      data: {
        eventType: eventDto.eventType,
        userId: eventDto.userId || null,
        sessionId: eventDto.sessionId || null,
        productId: eventDto.productId || null,
        source: eventDto.source || null,
        campaign: eventDto.campaign || null,
        postId: eventDto.postId || null,
        ...(eventDto.metadata ? { metadata: eventDto.metadata } : {}),
      },
    });
  }
}
