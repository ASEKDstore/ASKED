import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './telegram-auth.guard';

// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
@Injectable()
export class DevAdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        AuthenticatedRequest & { url?: string; query?: Record<string, string | string[]> }
      >();

    const expectedToken = process.env.ADMIN_DEV_TOKEN;

    // Check token from header first
    const devTokenHeader = request.headers['x-admin-dev-token'];
    let devToken: string | null = null;

    // Handle header as string or array
    if (devTokenHeader) {
      devToken =
        typeof devTokenHeader === 'string'
          ? devTokenHeader
          : Array.isArray(devTokenHeader)
            ? devTokenHeader[0]
            : null;
    }

    // If not found in header, check query params (Express automatically parses query string)
    if (!devToken && request.query?.token) {
      const queryToken = request.query.token;
      devToken =
        typeof queryToken === 'string'
          ? queryToken
          : Array.isArray(queryToken)
            ? queryToken[0]
            : null;
    }

    const hasToken = !!devToken;
    const tokenMatches = devToken && expectedToken && devToken === expectedToken;

    // TEMP: Log for debugging
    console.log('DevAdminGuard:', {
      hasToken,
      fromHeader: !!devTokenHeader,
      fromQuery: !!request.query?.token,
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
