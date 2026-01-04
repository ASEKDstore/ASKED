import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TelegramUser } from '../types/telegram-user.interface';
import type { AuthenticatedRequest } from '../telegram-auth.guard';

export const TelegramUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TelegramUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  }
);

