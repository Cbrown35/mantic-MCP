import axios, { AxiosInstance, AxiosError } from 'axios';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { OAuth2Token } from '../types/index.js';

export class MauticApiClient {
  public v1: AxiosInstance;
  public v2: AxiosInstance;
  private token: OAuth2Token | null = null;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private tokenEndpoint: string;

  constructor(config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    tokenEndpoint: string;
  }) {
    this.baseUrl = config.baseUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenEndpoint = config.tokenEndpoint;

    // v1 API instance (FOSRestBundle - existing endpoints)
    this.v1 = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    // v2 API instance (API Platform - new Mautic 7 endpoints)
    const v2BaseUrl = this.baseUrl.replace(/\/?$/, '').replace(/\/api\/?$/, '') + '/api/v2/';
    this.v2 = axios.create({
      baseURL: v2BaseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/ld+json',
        'Content-Type': 'application/ld+json',
      },
    });

    this.setupInterceptors(this.v1);
    this.setupInterceptors(this.v2);
  }

  private setupInterceptors(instance: AxiosInstance) {
    // Request interceptor to add authorization header
    instance.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token.access_token}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.token?.refresh_token) {
          try {
            await this.refreshToken();
            const originalRequest = error.config;
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${this.token?.access_token}`;
              return instance.request(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async ensureValidToken() {
    if (!this.token || Date.now() >= this.token.expires_at) {
      if (this.token?.refresh_token) {
        await this.refreshToken();
      } else {
        await this.getAccessToken();
      }
    }
  }

  private async getAccessToken() {
    try {
      const response = await axios.post(this.tokenEndpoint, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.token = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000) - 60000,
        token_type: response.data.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new McpError(ErrorCode.InternalError, 'Failed to authenticate with Mautic API');
    }
  }

  private async refreshToken() {
    if (!this.token?.refresh_token) {
      await this.getAccessToken();
      return;
    }

    try {
      const response = await axios.post(this.tokenEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.token = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || this.token.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000) - 60000,
        token_type: response.data.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await this.getAccessToken();
    }
  }

  /**
   * Parse API Platform v2 collection response (Hydra format)
   */
  parseV2Collection<T>(data: any): { items: T[]; total: number } {
    if (data['hydra:member']) {
      return {
        items: data['hydra:member'],
        total: data['hydra:totalItems'] || data['hydra:member'].length,
      };
    }
    return { items: Array.isArray(data) ? data : [data], total: 1 };
  }

  /**
   * Extract error message from either v1 or v2 API error responses
   */
  static extractErrorMessage(error: AxiosError): string {
    const data = error.response?.data as any;
    return data?.errors?.[0]?.message ||
           data?.error?.message ||
           data?.['hydra:description'] ||
           data?.detail ||
           error.message;
  }
}
