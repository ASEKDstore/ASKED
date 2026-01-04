const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
  }
}

interface RequestOptions extends RequestInit {
  initData?: string | null;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { initData, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ApiClientError(
        errorText || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiClientError(error.message);
    }

    throw new ApiClientError('Network error occurred');
  }
}

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

export const api = {
  async getMe(initData: string | null): Promise<User> {
    return request<User>('/users/me', {
      method: 'GET',
      initData,
    });
  },

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return request<{ status: string; timestamp: string }>('/health', {
      method: 'GET',
    });
  },
};

