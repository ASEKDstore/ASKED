import * as crypto from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { TelegramUser } from './types/telegram-user.interface';

@Injectable()
export class TelegramInitDataService {
  private readonly botToken: string;
  private readonly authMaxAgeSec: number;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.authMaxAgeSec = this.configService.get<number>('TELEGRAM_AUTH_MAX_AGE_SEC', 86400);

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Verify Telegram WebApp initData signature using OFFICIAL algorithm
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   * 
   * IMPORTANT: Follows the exact specification:
   * - DO NOT use botToken directly as HMAC key
   * - DO NOT verify initDataUnsafe
   * - DO NOT skip sorting params
   * - 'WebAppData' string is mandatory
   */
  verifyInitData(initData: string): boolean {
    return this.verifyTelegramInitData(initData, this.botToken);
  }

  /**
   * Standalone verification function matching exact official Telegram algorithm
   */
  verifyTelegramInitData(initData: string, botToken: string): boolean {
    try {
      // 1. Parse initData as URLSearchParams
      const params = new URLSearchParams(initData);

      // 2. Extract hash and remove it from the set
      const hash = params.get('hash');
      if (!hash) {
        return false;
      }
      params.delete('hash');

      // 3. Build data_check_string: sorted key=value pairs, joined by \n
      const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // 4. Compute secret_key = HMAC_SHA256(key="WebAppData", msg=botToken)
      // IMPORTANT: 'WebAppData' is the key, botToken is the message
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // 5. Compute calculated_hash = HMAC_SHA256(key=secret_key, msg=data_check_string) in hex
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // 6. Compare calculated_hash with hash from initData
      return calculatedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify auth_date (not older than configured max age)
   */
  verifyAuthDate(initData: string): boolean {
    try {
      const params = new URLSearchParams(initData);
      const authDateStr = params.get('auth_date');

      if (!authDateStr) {
        return false;
      }

      const authDate = parseInt(authDateStr, 10);
      if (isNaN(authDate)) {
        return false;
      }

      const authTimestamp = authDate * 1000; // Convert to milliseconds
      const now = Date.now();
      const maxAge = this.authMaxAgeSec * 1000;

      return now - authTimestamp <= maxAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse user from initData
   */
  parseUser(initData: string): TelegramUser | null {
    try {
      const params = new URLSearchParams(initData);

      // Parse user JSON string (URLSearchParams already decodes)
      const userStr = params.get('user');
      if (!userStr) {
        return null;
      }

      // Parse user JSON (may need to decode if still encoded)
      let user: TelegramUser;
      try {
        user = JSON.parse(userStr) as TelegramUser;
      } catch {
        // Try decoding if parsing fails
        user = JSON.parse(decodeURIComponent(userStr)) as TelegramUser;
      }

      // Ensure required fields
      if (!user.id || !user.first_name) {
        return null;
      }

      // Get auth_date from params (not from user object)
      const authDateStr = params.get('auth_date');
      if (authDateStr) {
        user.auth_date = parseInt(authDateStr, 10);
      }

      // Get hash from params
      const hash = params.get('hash');
      if (hash) {
        user.hash = hash;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Full validation: signature + auth_date + parse user
   */
  validateAndParse(initData: string): TelegramUser {
    if (!this.verifyInitData(initData)) {
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }

    if (!this.verifyAuthDate(initData)) {
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }

    const user = this.parseUser(initData);
    if (!user) {
      throw new UnauthorizedException('Authentication required. Please open the app from Telegram');
    }

    return user;
  }
}
