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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: fetchOptions.body
        ? typeof fetchOptions.body === 'string'
          ? fetchOptions.body
          : JSON.stringify(fetchOptions.body)
        : undefined,
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

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  stock: number;
  images: Array<{ id: string; url: string; sort: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductsListResponse {
  items: Product[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  comment?: string;
  items: Array<{ productId: string; qty: number }>;
}

export interface Order {
  id: string;
  userId: string;
  status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  comment: string | null;
  paymentMethod: 'MANAGER';
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    titleSnapshot: string;
    priceSnapshot: number;
    qty: number;
  }>;
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

  async getProducts(params?: {
    q?: string;
    category?: string;
    tags?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'new' | 'price_asc' | 'price_desc';
    page?: number;
    pageSize?: number;
  }): Promise<ProductsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<ProductsListResponse>(`/products${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  async getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'GET',
    });
  },

  async createOrder(
    initData: string | null,
    order: CreateOrderDto
  ): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      initData,
      body: JSON.stringify(order),
    });
  },
};

