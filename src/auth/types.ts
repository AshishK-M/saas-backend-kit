export type Role = 'admin' | 'user' | 'guest' | string;

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  name?: string;
  picture?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthOptions {
  jwtSecret?: string;
  jwtExpiresIn?: string;
  refreshSecret?: string;
  refreshExpiresIn?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
}

export interface AuthUserRequest extends Request {
  user?: JWTPayload;
}

export type Permission = string;

export interface RolePermissions {
  [role: string]: Permission[];
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: ['*'],
  user: ['read', 'write:own'],
  guest: ['read:public'],
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name?: string;
  role?: Role;
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}
