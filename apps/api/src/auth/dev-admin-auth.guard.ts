import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './telegram-auth.guard';

// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@Injectable()
export class DevAdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const devTokenHeader = request.headers['x-admin-dev-token'];
    const expectedToken = process.env.ADMIN_DEV_TOKEN;

    // If no dev token configured, skip this guard
    if (!expectedToken || expectedToken.trim() === '') {
      return false;
    }

    // Handle header as string or array
    const devToken =
      typeof devTokenHeader === 'string'
        ? devTokenHeader
        : Array.isArray(devTokenHeader)
          ? devTokenHeader[0]
          : null;

    // If token matches, set dev admin mode
    if (devToken && devToken === expectedToken) {
      // Mark request as dev admin
      (request as any).isDevAdmin = true;

      // Set minimal user object for compatibility
      request.user = {
        id: 930749603,
        firstName: 'Dev',
        lastName: 'Admin',
        username: 'dev_admin',
      } as any;

      return true;
    }

    // Token doesn't match or missing, continue to other guards
    return false;
  }
}
