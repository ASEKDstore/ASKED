import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from './telegram-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Find user by telegramId
    const user = await this.prisma.user.findUnique({
      where: { telegramId: request.user.id.toString() },
      include: {
        admin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.admin) {
      throw new ForbiddenException('Admin access required');
    }

    // Check role (OWNER or MANAGER are allowed)
    if (user.admin.role !== 'OWNER' && user.admin.role !== 'MANAGER') {
      throw new ForbiddenException('Insufficient admin privileges');
    }

    return true;
  }
}



