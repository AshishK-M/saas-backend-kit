import jwt from 'jsonwebtoken';
import { JWTPayload, TokenPair } from './types';
import { config } from '../config';

export class JWTService {
  private secret: string;
  private expiresIn: string;
  private refreshSecret: string;
  private refreshExpiresIn: string;

  constructor(options: { jwtSecret?: string; jwtExpiresIn?: string; refreshSecret?: string; refreshExpiresIn?: string } = {}) {
    this.secret = options.jwtSecret || config.get('JWT_SECRET') || 'default-secret-change-in-production';
    this.expiresIn = options.jwtExpiresIn || config.get('JWT_EXPIRES_IN') || '7d';
    this.refreshSecret = options.refreshSecret || config.get('JWT_REFRESH_SECRET') || this.secret;
    this.refreshExpiresIn = options.refreshExpiresIn || config.get('JWT_REFRESH_EXPIRES_IN') || '30d';
  }

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshExpiresIn });
  }

  generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.secret) as JWTPayload;
  }

  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.refreshSecret) as JWTPayload;
  }

  refreshTokens(refreshToken: string): TokenPair {
    const { iat, exp, nbf, ...payload } = this.verifyRefreshToken(refreshToken) as JWTPayload & { iat?: number; exp?: number; nbf?: number };
    return this.generateTokenPair(payload);
  }
}

export const jwtService = new JWTService();
