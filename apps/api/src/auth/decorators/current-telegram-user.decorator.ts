import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../telegram-auth.guard';
import type { TelegramUser } from '../types/telegram-user.interface';

export const CurrentTelegramUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TelegramUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
