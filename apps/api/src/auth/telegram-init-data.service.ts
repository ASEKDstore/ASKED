import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { TelegramUser, TelegramInitData } from './types/telegram-user.interface';

@Injectable()
export class TelegramInitDataService {
  private readonly botToken: string;
  private readonly authMaxAgeSec: number;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.authMaxAgeSec = this.configService.get<number>(
      'TELEGRAM_AUTH_MAX_AGE_SEC',
      86400
    );

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Verify Telegram WebApp initData signature
   */
  verifyInitData(initData: string): boolean {
    try {
      // 1. Parse initData as querystring
      const params = new URLSearchParams(initData);

      // 2. Extract hash and remove it from the set
      const hash = params.get('hash');
      if (!hash) {
        return false;
      }
      params.delete('hash');

      // 3. Build data_check_string: sorted key=value pairs, joined by \n
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // 4. Compute secret_key = HMAC_SHA256(key="WebAppData", msg=TELEGRAM_BOT_TOKEN)
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      // 5. Compute computed_hash = HMAC_SHA256(key=secret_key, msg=data_check_string) in hex
      const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // 6. Constant-time compare with hash (lengths must match)
      if (computedHash.length !== hash.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hash, 'hex')
      );
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

      // Parse user JSON string
      const userStr = params.get('user');
      if (!userStr) {
        return null;
      }

      const user = JSON.parse(decodeURIComponent(userStr)) as TelegramUser;

      // Ensure required fields
      if (!user.id || !user.first_name || !user.auth_date) {
        return null;
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
      throw new UnauthorizedException('Invalid initData signature');
    }

    if (!this.verifyAuthDate(initData)) {
      throw new UnauthorizedException('initData auth_date expired or invalid');
    }

    const user = this.parseUser(initData);
    if (!user) {
      throw new UnauthorizedException('Failed to parse user from initData');
    }

    return user;
  }

}

