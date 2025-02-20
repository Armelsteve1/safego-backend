import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.COGNITO_CLIENT_ID,
    });
  }

  async validate(payload: any) {
    if (!payload) throw new UnauthorizedException('Invalid token');
    return { id: payload.sub, email: payload.email };
  }
}
