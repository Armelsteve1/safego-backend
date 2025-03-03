export interface JwtPayload {
  sub: string;
  email: string;
  token_use?: string;
  'cognito:groups'?: string[];
  exp?: number;
  iat?: number;
}
