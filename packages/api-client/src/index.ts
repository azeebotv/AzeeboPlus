import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@azeebo/shared-types';

interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  authStorageKey?: string;
}

interface TokenStorage {
  get: () => string | null;
  set: (token: string) => void;
  remove: () => void;
}

class LocalStorageTokenStorage implements TokenStorage {
  get(): string | null {
    return localStorage.getItem('auth_token');
  }

  set(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  remove(): void {
    localStorage.removeItem('auth_token');
  }
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private tokenStorage: TokenStorage;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      authStorageKey: 'auth_token',
      ...config,
    };

    this.tokenStorage = new LocalStorageTokenStorage();

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.get();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.tokenStorage.remove();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, config);
  }

  async post<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, { data, ...config });
  }

  async put<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, { data, ...config });
  }

  async patch<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, { data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, config);
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client({
        method,
        url,
        ...config,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.response?.status?.toString() || 'UNKNOWN',
          message: error.response?.data?.message || error.message || 'An error occurred',
        },
      };
    }
  }
}

const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};

export { ApiClient, ApiClientConfig, createApiClient };
