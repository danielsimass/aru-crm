import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Nest AuthGuard signature
    _context: ExecutionContext,
  ): TUser {
    if (err) {
      throw new UnauthorizedException(err.message || 'Invalid token');
    }
    if (!user) {
      const message = info?.message ?? 'No token provided or token invalid';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
