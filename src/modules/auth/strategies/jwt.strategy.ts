import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JWT_SECRET } from '../constants';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          const token = request?.cookies?.['access_token'];
          return typeof token === 'string' && token.length > 0 ? token : null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}
