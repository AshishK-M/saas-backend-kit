import { OAuthProvider } from './types';
import { config } from '../config';

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export class OAuthService {
  private providers: Map<string, OAuthProvider> = new Map();

  constructor() {
    const googleClientId = config.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = config.get('GOOGLE_CLIENT_SECRET');
    const googleRedirectUri = config.get('GOOGLE_REDIRECT_URI');

    if (googleClientId && googleClientSecret && googleRedirectUri) {
      this.registerProvider('google', {
        name: 'google',
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: googleRedirectUri,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      });
    }
  }

  registerProvider(name: string, provider: OAuthProvider): void {
    this.providers.set(name, provider);
  }

  getProvider(name: string): OAuthProvider | undefined {
    return this.providers.get(name);
  }

  getAuthorizationUrl(providerName: string, state?: string): string {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not registered`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state || '',
    });

    return `${provider.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCode(providerName: string, code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not registered`);
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: provider.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async getUserInfo(providerName: string, accessToken: string): Promise<OAuthUserInfo> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`OAuth provider ${providerName} not registered`);
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth user info fetch failed: ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }
}

export const oauthService = new OAuthService();
