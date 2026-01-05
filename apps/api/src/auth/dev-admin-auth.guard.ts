import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './telegram-auth.guard';

// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@Injectable()
export class DevAdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & { url?: string }>();

    const devTokenHeader = request.headers['x-admin-dev-token'];
    const expectedToken = process.env.ADMIN_DEV_TOKEN;

    // Handle header as string or array
    const devToken =
      typeof devTokenHeader === 'string'
        ? devTokenHeader
        : Array.isArray(devTokenHeader)
          ? devTokenHeader[0]
          : null;

    const hasHeader = !!devToken;
    const tokenMatches = devToken && expectedToken && devToken === expectedToken;

    // TEMP: Log for debugging
    console.log('DevAdminGuard:', {
      hasHeader,
      ok: tokenMatches,
      path: request.url,
    });

    // If dev token is configured and matches, set dev admin mode
    if (expectedToken && expectedToken.trim() !== '' && tokenMatches) {
      // Mark request as dev admin
      (request as any).isDevAdmin = true;

      // Set minimal user object for compatibility
      request.user = {
        id: 930749603,
        firstName: 'Dev',
        lastName: 'Admin',
        username: 'dev_admin',
      } as any;
    }

    // Always return true to allow other guards to handle authentication
    // If isDevAdmin is set, TelegramAuthGuard and AdminGuard will skip their checks
    return true;
  }
}
