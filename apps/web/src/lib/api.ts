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

export interface AdminProductsListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  stock?: number;
  images?: Array<{ url: string; sort?: number }>;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateProductDto {
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  stock?: number;
  images?: Array<{ url: string; sort?: number }>;
  categoryIds?: string[];
  tagIds?: string[];
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

export interface OrderListItem {
  id: string;
  userId: string;
  status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdersListResponse {
  items: OrderListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
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

  // Admin endpoints
  async getAdminMe(initData: string | null): Promise<{
    user: {
      id: string;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
    };
    role: 'OWNER' | 'MANAGER';
  }> {
    return request('/admin/me', {
      method: 'GET',
      initData,
    });
  },

  async getAdminOrders(initData: string | null): Promise<OrdersListResponse> {
    return request<OrdersListResponse>('/admin/orders', {
      method: 'GET',
      initData,
    });
  },

  async getAdminProducts(
    initData: string | null,
    params?: { q?: string; status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; page?: number; pageSize?: number }
  ): Promise<AdminProductsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<AdminProductsListResponse>(`/admin/products${query ? `?${query}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getAdminProduct(initData: string | null, id: string): Promise<Product> {
    return request<Product>(`/admin/products/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminProduct(initData: string | null, product: CreateProductDto): Promise<Product> {
    return request<Product>('/admin/products', {
      method: 'POST',
      initData,
      body: JSON.stringify(product),
    });
  },

  async updateAdminProduct(initData: string | null, id: string, product: UpdateProductDto): Promise<Product> {
    return request<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(product),
    });
  },

  async deleteAdminProduct(initData: string | null, id: string): Promise<Product> {
    return request<Product>(`/admin/products/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  async getCategories(): Promise<Category[]> {
    // Try admin endpoint first, fallback to public
    try {
      return request<Category[]>('/categories', {
        method: 'GET',
      });
    } catch {
      return [];
    }
  },

  async getTags(): Promise<Tag[]> {
    // Try admin endpoint first, fallback to public
    try {
      return request<Tag[]>('/tags', {
        method: 'GET',
      });
    } catch {
      return [];
    }
  },

  // Admin Categories
  async getAdminCategories(initData: string | null): Promise<Category[]> {
    return request<Category[]>('/admin/categories', {
      method: 'GET',
      initData,
    });
  },

  async createAdminCategory(initData: string | null, category: { name: string; slug: string; sort?: number }): Promise<Category> {
    return request<Category>('/admin/categories', {
      method: 'POST',
      initData,
      body: JSON.stringify(category),
    });
  },

  async updateAdminCategory(initData: string | null, id: string, category: { name?: string; slug?: string; sort?: number }): Promise<Category> {
    return request<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(category),
    });
  },

  async deleteAdminCategory(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  // Admin Tags
  async getAdminTags(initData: string | null): Promise<Tag[]> {
    return request<Tag[]>('/admin/tags', {
      method: 'GET',
      initData,
    });
  },

  async createAdminTag(initData: string | null, tag: { name: string; slug: string }): Promise<Tag> {
    return request<Tag>('/admin/tags', {
      method: 'POST',
      initData,
      body: JSON.stringify(tag),
    });
  },

  async updateAdminTag(initData: string | null, id: string, tag: { name?: string; slug?: string }): Promise<Tag> {
    return request<Tag>(`/admin/tags/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(tag),
    });
  },

  async deleteAdminTag(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/tags/${id}`, {
      method: 'DELETE',
      initData,
    });
  },
};

