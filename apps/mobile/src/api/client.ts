import Constants from 'expo-constants';

interface ApiClientConfig {
  baseURL: string;
  token: string | null;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClientClass {
  private config: ApiClientConfig = {
    baseURL: Constants.expoConfig?.extra?.apiBaseURL || 'http://localhost:3000',
    token: null,
  };

  setToken(token: string | null) {
    this.config.token = token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.config.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error: ApiError = new Error(data?.message || 'An error occurred');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('Request timeout. Please try again.');
        timeoutError.status = 408;
        throw timeoutError;
      }
      
      if (error.status) {
        throw error;
      }
      const networkError: ApiError = new Error('Network error. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

export const apiClient = new ApiClientClass();