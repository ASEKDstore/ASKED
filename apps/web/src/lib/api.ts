import { getInitData } from './telegram';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? '';

// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
function getDevAdminToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token && DEV_ADMIN_TOKEN !== '' && token === DEV_ADMIN_TOKEN) {
      return token;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return '';
}

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

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // Check for dev token in URL for admin endpoints
  const isAdminEndpoint = endpoint.startsWith('/admin');
  let devToken = '';
  
  if (isAdminEndpoint) {
    devToken = getDevAdminToken();
    if (devToken) {
      // In dev mode, use dev token instead of Telegram initData
      headers['x-admin-dev-token'] = devToken;
    } else {
      // Normal mode: add Telegram initData
      const telegramInitData = getInitData();
      const finalInitData = initData ?? telegramInitData;

      if (finalInitData) {
        headers['x-telegram-init-data'] = finalInitData;
      }
    }
  } else {
    // Non-admin endpoints: always add Telegram initData if available
    const telegramInitData = getInitData();
    const finalInitData = initData ?? telegramInitData;

    if (finalInitData) {
      headers['x-telegram-init-data'] = finalInitData;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // Log in dev mode
  if (process.env.NODE_ENV === 'development' && isAdminEndpoint) {
    console.log('[API]', {
      endpoint,
      method: fetchOptions.method || 'GET',
      hasDevToken: !!devToken,
    });
  }

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
      const errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiClientError(
        `[${response.status}] ${errorMessage}`,
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

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  isActive: boolean;
  sort: number;
  promoSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoMedia {
  id: string;
  promoId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  sort: number;
}

export interface Promo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isActive: boolean;
  ctaType: 'PRODUCT' | 'URL';
  ctaText: string | null;
  ctaUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  media?: PromoMedia[];
}

export interface CreateBannerDto {
  title: string;
  subtitle?: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  isActive?: boolean;
  sort?: number;
  promoSlug: string;
}

export interface UpdateBannerDto {
  title?: string;
  subtitle?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  isActive?: boolean;
  sort?: number;
  promoSlug?: string;
}

export interface CreatePromoDto {
  slug: string;
  title: string;
  description?: string | null;
  isActive?: boolean;
  ctaType?: 'PRODUCT' | 'URL';
  ctaText?: string | null;
  ctaUrl?: string | null;
  media?: Array<{ mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; sort?: number }>;
}

export interface UpdatePromoDto {
  slug?: string;
  title?: string;
  description?: string | null;
  isActive?: boolean;
  ctaType?: 'PRODUCT' | 'URL';
  ctaText?: string | null;
  ctaUrl?: string | null;
  media?: Array<{ mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; sort?: number }>;
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

  async getAdminOrders(
    initData: string | null,
    params?: { status?: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED'; search?: string; page?: number; pageSize?: number }
  ): Promise<OrdersListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<OrdersListResponse>(`/admin/orders${query ? `?${query}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getAdminOrder(initData: string | null, id: string): Promise<Order> {
    return request<Order>(`/admin/orders/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async updateAdminOrderStatus(
    initData: string | null,
    id: string,
    status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED'
  ): Promise<Order> {
    return request<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify({ status }),
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

  // Admin Banners
  async getAdminBanners(
    initData: string | null,
    query?: { q?: string; isActive?: boolean; page?: number; pageSize?: number }
  ): Promise<{ items: Banner[]; total: number; page: number; pageSize: number }> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{ items: Banner[]; total: number; page: number; pageSize: number }>(
      `/admin/banners${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        initData,
      }
    );
  },

  async getAdminBanner(initData: string | null, id: string): Promise<Banner> {
    return request<Banner>(`/admin/banners/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminBanner(initData: string | null, banner: CreateBannerDto): Promise<Banner> {
    return request<Banner>('/admin/banners', {
      method: 'POST',
      initData,
      body: JSON.stringify(banner),
    });
  },

  async updateAdminBanner(initData: string | null, id: string, banner: UpdateBannerDto): Promise<Banner> {
    return request<Banner>(`/admin/banners/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(banner),
    });
  },

  async deleteAdminBanner(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/banners/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  // Admin Promos
  async getAdminPromos(initData: string | null): Promise<Promo[]> {
    return request<Promo[]>('/admin/promos', {
      method: 'GET',
      initData,
    });
  },

  async getAdminPromo(initData: string | null, id: string): Promise<Promo> {
    return request<Promo>(`/admin/promos/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminPromo(initData: string | null, promo: CreatePromoDto): Promise<Promo> {
    return request<Promo>('/admin/promos', {
      method: 'POST',
      initData,
      body: JSON.stringify(promo),
    });
  },

  async updateAdminPromo(initData: string | null, id: string, promo: UpdatePromoDto): Promise<Promo> {
    return request<Promo>(`/admin/promos/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(promo),
    });
  },

  async deleteAdminPromo(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/promos/${id}`, {
      method: 'DELETE',
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

