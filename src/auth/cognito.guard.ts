import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private jwksUrl = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token provided');

    try {
      const token = authHeader.split(' ')[1];

      const decoded = await this.verifyCognitoToken(token);

      request.user = {
        id: decoded.sub,
        email: decoded.email,
        groups: decoded['cognito:groups'] || [],
        accessToken: token,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException(`Invalid token: ${error.message}`);
    }
  }
  private async verifyCognitoToken(token: string): Promise<any> {
    const { data } = await axios.get(this.jwksUrl);
    const jwks = data.keys;

    const decodedHeader: any = jwt.decode(token, { complete: true });

    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new UnauthorizedException('Invalid token header');
    }
    const key = jwks.find((k) => k.kid === decodedHeader.header.kid);

    if (!key) {
      throw new UnauthorizedException('Invalid token key');
    }
    const pem = jwkToPem(key);
    return new Promise((resolve, reject) => {
      jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          reject(new UnauthorizedException('Token verification failed'));
        } else {
          resolve(decoded);
        }
      });
    });
  }
}
