import { getInitData } from './telegram';

// Helper to safely get Telegram initData
function getTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? '';

// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
// Storage key for admin dev token
const ADMIN_TOKEN_STORAGE_KEY = 'admin_dev_token';

/**
 * Get admin dev token from localStorage or URL
 * If token is in URL, store it in localStorage for future use
 */
function getDevAdminToken(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    // First, try to get from localStorage
    const storedToken = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (storedToken && DEV_ADMIN_TOKEN !== '' && storedToken === DEV_ADMIN_TOKEN) {
      return storedToken;
    }

    // If not in storage, try to get from URL
    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');
    if (urlToken && DEV_ADMIN_TOKEN !== '' && urlToken === DEV_ADMIN_TOKEN) {
      // Store in localStorage for future requests
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, urlToken);
      // Optionally clean up URL (remove token from query string)
      if (url.searchParams.has('token')) {
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
      return urlToken;
    }
  } catch {
    // Ignore errors
  }
  return '';
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  statusCode?: number;
  responseBody?: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
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

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Safely merge headers from fetchOptions
  const headers: Record<string, string> = { ...baseHeaders };
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, fetchOptions.headers);
    }
  }

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
      const telegramInitData = initData ?? getTelegramInitData() ?? getInitData();
      const finalInitData = telegramInitData;

      if (finalInitData) {
        headers['x-telegram-init-data'] = finalInitData;
      }
    }
  } else {
    // Non-admin endpoints: always add Telegram initData if available
    // Try provided initData first, then window.Telegram, then helper
    // IMPORTANT: Always try to get initData, even if not explicitly provided
    const telegramInitData = initData ?? getTelegramInitData() ?? getInitData();
    const finalInitData = telegramInitData;

    if (finalInitData) {
      headers['x-telegram-init-data'] = finalInitData;
    }

    // Debug logging in dev mode (only log initData presence, not content)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[API] Request:', {
        endpoint,
        method: fetchOptions.method || 'GET',
        hasInitData: !!finalInitData,
        initDataLength: finalInitData?.length ?? 0,
        initDataSource: initData ? 'provided' : (getTelegramInitData() ? 'window.Telegram' : (getInitData() ? 'helper' : 'none')),
      });
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
      // Try to parse error as JSON first, fallback to text
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let responseBody: unknown = undefined;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseBody = await response.json();
          if (typeof responseBody === 'object' && responseBody !== null) {
            const errorObj = responseBody as { message?: string; error?: string };
            errorMessage = errorObj.message || errorObj.error || errorMessage;
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // If parsing fails, use default error message
      }
      
      // Log auth errors in dev mode for debugging
      if (process.env.NODE_ENV === 'development' && (response.status === 401 || response.status === 403)) {
        console.error('[API] Auth error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          hasInitData: !!headers['x-telegram-init-data'],
          initDataLength: headers['x-telegram-init-data']?.length ?? 0,
        });
      }
      
      throw new ApiClientError(
        `[${response.status}] ${errorMessage}`,
        response.status,
        responseBody
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
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
  sku: string | null;
  price: number;
  costPrice: number | null;
  packagingCost: number | null;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  stock: number;
  averageRating: number;
  reviewsCount: number;
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
  sort: number; // Always present, defaults to 0 in Prisma schema
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Subscription {
  id: string;
  name: string;
  provider: string | null;
  lastPaidAt: string; // ISO datetime string
  periodMonths: number;
  remindBeforeDays: number;
  nextDueAt: string; // ISO datetime string (computed by backend)
  lastRemindedAt: string | null; // ISO datetime string
  lastRemindedForDueAt: string | null; // ISO datetime string
  isActive: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface Notification {
  id: string;
  notification: {
    type: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'ADMIN_BROADCAST' | 'ADMIN_DIRECT';
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    createdAt: string;
  };
  isRead: boolean;
  readAt: string | null;
}

export interface NotificationsListResponse {
  items: Notification[];
  nextCursor?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  updated: number;
}

export interface MarkReadDto {
  ids?: string[];
  all?: boolean;
}

export interface CreateSubscriptionDto {
  name: string;
  provider?: string | null;
  lastPaidAt: string; // ISO datetime string
  periodMonths?: number;
  remindBeforeDays?: number;
  isActive?: boolean;
}

export interface UpdateSubscriptionDto {
  name?: string;
  provider?: string | null;
  lastPaidAt?: string; // ISO datetime string
  periodMonths?: number;
  remindBeforeDays?: number;
  isActive?: boolean;
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
  sku?: string | null;
  price: number;
  costPrice?: number | null;
  packagingCost?: number | null;
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
  sku?: string | null;
  price?: number;
  costPrice?: number | null;
  packagingCost?: number | null;
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

export interface ReviewMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  text: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  media: ReviewMedia[];
  user?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  };
}

export interface ReviewsListResponse {
  items: Review[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewDto {
  productId: string;
  orderId?: string;
  rating: number;
  text?: string;
  media?: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>;
}

export interface Order {
  id: string;
  userId: string;
  status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
  channel?: 'AS' | 'LAB';
  seq?: number | null;
  number?: string | null;
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
  channel?: 'AS' | 'LAB';
  seq?: number | null;
  number?: string | null;
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

export interface AnalyticsOverview {
  subscribersNow: number;
  subscribersGrowth: number;
  revenue: number;
  ordersCount: number;
  conversion: number;
  aov: number;
}

export interface TelegramSubscribersResponse {
  data: Array<{
    date: string;
    count: number;
    growth: number;
  }>;
}

export interface TelegramTopPostsResponse {
  items: Array<{
    id: string;
    messageId: string;
    textExcerpt?: string;
    views: number;
    date: string;
  }>;
}

export interface TopProductsResponse {
  items: Array<{
    productId: string;
    productTitle: string;
    metric: number;
  }>;
}

export interface FunnelResponse {
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export interface LabProduct {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  coverMediaType: 'IMAGE' | 'VIDEO';
  coverMediaUrl: string;
  ctaType: 'NONE' | 'PRODUCT' | 'URL';
  ctaProductId: string | null;
  ctaUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabProductsListResponse {
  items: LabProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLabProductDto {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  price?: number;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
  coverMediaType: 'IMAGE' | 'VIDEO';
  coverMediaUrl: string;
  ctaType?: 'NONE' | 'PRODUCT' | 'URL';
  ctaProductId?: string | null;
  ctaUrl?: string | null;
}

export interface LabWorkMedia {
  id: string;
  labWorkId: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  sort: number;
}

export interface LabWork {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  coverUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  media: LabWorkMedia[];
}

export interface LabWorksListResponse {
  items: LabWork[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLabWorkDto {
  title: string;
  slug?: string | null;
  description?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface UpdateLabWorkDto {
  title?: string;
  slug?: string | null;
  description?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateLabWorkMediaDto {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  sort?: number;
}

// Паллеты (Polet)
export interface PoziciyaPoleta {
  id: string;
  poletId: string;
  nazvanie: string;
  kolichestvo: number;
  sebestoimostNaEd: number;
  tovarId: string | null;
  tovar?: {
    id: string;
    title: string;
    price: number;
  } | null;
}

export interface Polet {
  id: string;
  nazvanie: string;
  status: 'DRAFT' | 'RECEIVED' | 'DISASSEMBLED' | 'POSTED' | 'CANCELED';
  cenaPoleta: number;
  dostavka: number;
  prochieRashody: number;
  obshayaSumma: number;
  metodRaspredeleniya: 'BY_QUANTITY';
  primernoeKolvo: number | null;
  createdAt: string;
  updatedAt: string;
  pozicii: PoziciyaPoleta[];
}

export interface CreatePoletDto {
  nazvanie: string;
  cenaPoleta: number;
  dostavka: number;
  prochieRashody?: number;
  primernoeKolvo?: number;
}

export interface UpdatePoletDto {
  nazvanie?: string;
  cenaPoleta?: number;
  dostavka?: number;
  prochieRashody?: number;
  primernoeKolvo?: number | null;
}

export interface CreatePoziciyaDto {
  nazvanie: string;
  kolichestvo: number;
}

export interface UpdatePoziciyaDto {
  nazvanie?: string;
  kolichestvo?: number;
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

  // Public Banners
  async getBanners(): Promise<Banner[]> {
    return request<Banner[]>('/banners', {
      method: 'GET',
    });
  },

  // Public Promos
  async getPromoBySlug(slug: string): Promise<Promo> {
    return request<Promo>(`/promo/${slug}`, {
      method: 'GET',
    });
  },

  async getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'GET',
    });
  },

  async getSimilarProducts(id: string, limit: number = 8): Promise<Product[]> {
    return request<Product[]>(`/products/${id}/similar?limit=${limit}`, {
      method: 'GET',
    });
  },

  async getReviews(params?: { page?: number; pageSize?: number }): Promise<ReviewsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<ReviewsListResponse>(`/reviews${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  async getProductReviews(productId: string, params?: { page?: number; pageSize?: number }): Promise<ReviewsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<ReviewsListResponse>(`/products/${productId}/reviews${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  async createReview(initData: string | null, review: CreateReviewDto): Promise<Review> {
    return request<Review>('/reviews', {
      method: 'POST',
      initData,
      body: JSON.stringify(review),
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

  async createLabOrder(
    initData: string | null,
    order: {
      clothingType: string | null;
      size: string | null;
      colorChoice: string | null;
      customColor: string | null;
      placement: string | null;
      description: string;
      attachmentUrl?: string | null;
      customerName?: string;
      customerPhone?: string;
      phone?: string;
      address?: string;
    }
  ): Promise<Order> {
    return request<Order>('/orders/lab', {
      method: 'POST',
      initData,
      body: JSON.stringify(order),
    });
  },

  async getMyOrders(initData: string | null): Promise<OrdersListResponse> {
    return request<OrdersListResponse>('/public/orders/my', {
      method: 'GET',
      initData,
    });
  },

  async getMyLastOrder(initData: string | null): Promise<Order | null> {
    return request<Order | null>('/orders/my/last', {
      method: 'GET',
      initData,
    });
  },

  async getMyOrder(initData: string | null, id: string): Promise<Order> {
    return request<Order>(`/orders/my/${id}`, {
      method: 'GET',
      initData,
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

  async getAdminDashboardSummary(initData: string | null): Promise<{
    todayOrders: number;
    todayRevenue: number;
    totalOrders: number;
  }> {
    return request('/admin/dashboard/summary', {
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

  async deleteAdminOrder(initData: string | null, id: string): Promise<Order> {
    return request<Order>(`/admin/orders/${id}`, {
      method: 'DELETE',
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

  // Analytics
  async getAnalyticsOverview(
    initData: string | null,
    query?: { from?: string; to?: string; granularity?: 'hour' | 'day' | 'week' | 'month' }
  ): Promise<AnalyticsOverview> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<AnalyticsOverview>(`/admin/analytics/overview${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getTelegramSubscribers(
    initData: string | null,
    query?: { from?: string; to?: string; granularity?: 'hour' | 'day' | 'week' | 'month' }
  ): Promise<TelegramSubscribersResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<TelegramSubscribersResponse>(`/admin/analytics/telegram/subscribers${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getTopTelegramPosts(
    initData: string | null,
    query?: { limit?: number; from?: string; to?: string }
  ): Promise<TelegramTopPostsResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<TelegramTopPostsResponse>(`/admin/analytics/telegram/posts/top${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getTopProducts(
    initData: string | null,
    query?: { metric?: 'orders' | 'revenue' | 'views'; limit?: number; from?: string; to?: string }
  ): Promise<TopProductsResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<TopProductsResponse>(`/admin/analytics/shop/products/top${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getFunnel(
    initData: string | null,
    query?: { from?: string; to?: string }
  ): Promise<FunnelResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<FunnelResponse>(`/admin/analytics/funnel${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  // Public Events
  async trackEvent(event: {
    eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_STARTED' | 'PURCHASE';
    userId?: string;
    sessionId?: string;
    productId?: string;
    source?: string;
    campaign?: string;
    postId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/public/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  // Admin Lab Products
  async getAdminLabProducts(
    initData: string | null,
    query?: { q?: string; isActive?: boolean; page?: number; pageSize?: number }
  ): Promise<LabProductsListResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<LabProductsListResponse>(
      `/admin/lab-products${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        initData,
      }
    );
  },

  async getAdminLabProduct(initData: string | null, id: string): Promise<LabProduct> {
    return request<LabProduct>(`/admin/lab-products/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminLabProduct(initData: string | null, product: CreateLabProductDto): Promise<LabProduct> {
    return request<LabProduct>('/admin/lab-products', {
      method: 'POST',
      initData,
      body: JSON.stringify(product),
    });
  },

  async updateAdminLabProduct(initData: string | null, id: string, product: Partial<CreateLabProductDto>): Promise<LabProduct> {
    return request<LabProduct>(`/admin/lab-products/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(product),
    });
  },

  async deleteAdminLabProduct(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/lab-products/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  async addLabProductMedia(initData: string | null, labProductId: string, media: unknown): Promise<unknown> {
    return request<unknown>(`/admin/lab-products/${labProductId}/media`, {
      method: 'POST',
      initData,
      body: JSON.stringify(media),
    });
  },

  async updateLabProductMedia(initData: string | null, id: string, media: unknown): Promise<unknown> {
    return request<unknown>(`/admin/lab-products/media/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(media),
    });
  },

  async deleteLabProductMedia(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/lab-products/media/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  // Public Lab Products
  async getPublicLabProducts(): Promise<LabProduct[]> {
    return request<LabProduct[]>('/public/lab-products', {
      method: 'GET',
    });
  },

  // Admin Subscriptions
  async getAdminSubscriptions(initData: string | null): Promise<Subscription[]> {
    return request<Subscription[]>('/admin/subscriptions', {
      method: 'GET',
      initData,
    });
  },

  async getAdminSubscription(initData: string | null, id: string): Promise<Subscription> {
    return request<Subscription>(`/admin/subscriptions/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminSubscription(initData: string | null, subscription: CreateSubscriptionDto): Promise<Subscription> {
    return request<Subscription>('/admin/subscriptions', {
      method: 'POST',
      initData,
      body: JSON.stringify(subscription),
    });
  },

  async updateAdminSubscription(initData: string | null, id: string, subscription: UpdateSubscriptionDto): Promise<Subscription> {
    return request<Subscription>(`/admin/subscriptions/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(subscription),
    });
  },

  async deleteAdminSubscription(initData: string | null, id: string): Promise<Subscription> {
    return request<Subscription>(`/admin/subscriptions/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  // Notifications
  async getNotifications(initData: string | null, params?: { limit?: number; cursor?: string }): Promise<NotificationsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.cursor) searchParams.append('cursor', params.cursor);
    }
    const query = searchParams.toString();
    return request<NotificationsListResponse>(`/notifications/my${query ? `?${query}` : ''}`, {
      method: 'GET',
      initData,
    });
  },

  async getUnreadCount(initData: string | null): Promise<UnreadCountResponse> {
    return request<UnreadCountResponse>('/notifications/my/unread-count', {
      method: 'GET',
      initData,
    });
  },

  async markNotificationsRead(initData: string | null, dto: MarkReadDto): Promise<MarkReadResponse> {
    return request<MarkReadResponse>('/notifications/my/mark-read', {
      method: 'POST',
      initData,
      body: JSON.stringify(dto),
    });
  },

  // Admin Notifications
  async sendAdminBroadcast(initData: string | null, notification: { title: string; body: string; data?: Record<string, unknown> }): Promise<{ notificationId: string; delivered: number; totalUsers: number }> {
    return request<{ notificationId: string; delivered: number; totalUsers: number }>('/admin/notifications/broadcast', {
      method: 'POST',
      initData,
      body: JSON.stringify(notification),
    });
  },

  async sendAdminTargeted(
    initData: string | null,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      recipientTelegramIds: (string | number)[];
    },
  ): Promise<{ notificationId: string; recipientsCount: number }> {
    return request<{ notificationId: string; recipientsCount: number }>('/admin/notifications/targeted', {
      method: 'POST',
      initData,
      body: JSON.stringify(notification),
    });
  },

  // Admin Users
  async getAdminUsers(
    initData: string | null,
    params?: { search?: string; page?: number; pageSize?: number },
  ): Promise<{
    items: Array<{
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      firstOpenedAt: string | null;
      lastOpenedAt: string | null;
      opensCount: number | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{
      items: Array<{
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        firstOpenedAt: string | null;
        lastOpenedAt: string | null;
        opensCount: number | null;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/admin/users${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
      cache: 'no-store', // Force no caching for admin users endpoint
    });
  },

  // Warehouse
  async getWarehouseStock(initData: string | null): Promise<{
    items: Array<{
      productId: string;
      title: string;
      sku: string | null;
      currentStock: number;
      costPrice: number | null;
      packagingCost: number | null;
      price: number;
      unitProfit: number | null;
      marginPercent: number | null;
    }>;
  }> {
    return request<{
      items: Array<{
        productId: string;
        title: string;
        sku: string | null;
        currentStock: number;
        costPrice: number | null;
        packagingCost: number | null;
        price: number;
        unitProfit: number | null;
        marginPercent: number | null;
      }>;
    }>('/admin/warehouse/stock', {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async getWarehouseProfit(
    initData: string | null,
    params?: {
      from?: string;
      to?: string;
      status?: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
    },
  ): Promise<{
    revenue: number;
    cogs: number;
    packaging: number;
    grossProfit: number;
    marginPercent: number;
    orderCount: number;
    productBreakdown: Array<{
      productId: string;
      title: string;
      revenue: number;
      cogs: number;
      packaging: number;
      profit: number;
      quantity: number;
    }>;
    period: {
      from: string;
      to: string;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{
      revenue: number;
      cogs: number;
      packaging: number;
      grossProfit: number;
      marginPercent: number;
      orderCount: number;
      productBreakdown: Array<{
        productId: string;
        title: string;
        revenue: number;
        cogs: number;
        packaging: number;
        profit: number;
        quantity: number;
      }>;
      period: {
        from: string;
        to: string;
      };
    }>(`/admin/warehouse/profit${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async createInventoryMovementIn(
    initData: string | null,
    data: { productId: string; qty: number; note?: string },
  ): Promise<{
    id: string;
    productId: string;
    quantity: number;
    createdAt: string;
  }> {
    return request<{
      id: string;
      productId: string;
      quantity: number;
      createdAt: string;
    }>('/admin/warehouse/movements/in', {
      method: 'POST',
      initData,
      body: JSON.stringify(data),
    });
  },

  async createInventoryMovementAdjust(
    initData: string | null,
    data: { productId: string; qtyDelta: number; note?: string },
  ): Promise<{
    id: string;
    productId: string;
    quantity: number;
    createdAt: string;
  }> {
    return request<{
      id: string;
      productId: string;
      quantity: number;
      createdAt: string;
    }>('/admin/warehouse/movements/adjust', {
      method: 'POST',
      initData,
      body: JSON.stringify(data),
    });
  },

  async getWarehouseMovements(
    initData: string | null,
    params?: {
      from?: string;
      to?: string;
      productId?: string;
      type?: 'IN' | 'OUT' | 'ADJUST';
      sourceType?: 'ORDER' | 'MANUAL' | 'PURCHASE';
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    items: Array<{
      id: string;
      productId: string;
      productTitle: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUST';
      sourceType: 'ORDER' | 'MANUAL' | 'PURCHASE';
      sourceId: string | null;
      note: string | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{
      items: Array<{
        id: string;
        productId: string;
        productTitle: string;
        quantity: number;
        type: 'IN' | 'OUT' | 'ADJUST';
        sourceType: 'ORDER' | 'MANUAL' | 'PURCHASE';
        sourceId: string | null;
        note: string | null;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/admin/warehouse/movements${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async getWarehousePurchases(
    initData: string | null,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: 'DRAFT' | 'POSTED' | 'CANCELED';
    },
  ): Promise<{
    items: Array<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT' | 'POSTED' | 'CANCELED';
      postedAt: string | null;
      createdAt: string;
      updatedAt: string;
      itemsCount: number;
      totalCost: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{
      items: Array<{
        id: string;
        supplier: string | null;
        comment: string | null;
        status: 'DRAFT' | 'POSTED' | 'CANCELED';
        postedAt: string | null;
        createdAt: string;
        updatedAt: string;
        itemsCount: number;
        totalCost: number;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/admin/warehouse/purchases${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async getWarehousePurchase(
    initData: string | null,
    id: string,
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    postedAt: string | null;
    createdAt: string;
    updatedAt: string;
    items: Array<{
      id: string;
      productId: string;
      product: {
        id: string;
        title: string;
        sku: string | null;
      };
      qty: number;
      unitCost: number;
    }>;
  }> {
    return request<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT' | 'POSTED' | 'CANCELED';
      postedAt: string | null;
      createdAt: string;
      updatedAt: string;
      items: Array<{
        id: string;
        productId: string;
        product: {
          id: string;
          title: string;
          sku: string | null;
        };
        qty: number;
        unitCost: number;
      }>;
    }>(`/admin/warehouse/purchases/${id}`, {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async createWarehousePurchase(
    initData: string | null,
    data: {
      supplier?: string;
      comment?: string;
      items: Array<{
        productId: string;
        qty: number;
        unitCost: number;
      }>;
    },
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT';
    createdAt: string;
    items: Array<{
      id: string;
      productId: string;
      qty: number;
      unitCost: number;
    }>;
  }> {
    return request<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT';
      createdAt: string;
      items: Array<{
        id: string;
        productId: string;
        qty: number;
        unitCost: number;
      }>;
    }>('/admin/warehouse/purchases', {
      method: 'POST',
      initData,
      body: JSON.stringify(data),
    });
  },

  async updateWarehousePurchase(
    initData: string | null,
    id: string,
    data: {
      supplier?: string;
      comment?: string;
      items?: Array<{
        productId: string;
        qty: number;
        unitCost: number;
      }>;
    },
  ): Promise<{
    id: string;
    supplier: string | null;
    comment: string | null;
    status: 'DRAFT' | 'POSTED' | 'CANCELED';
    updatedAt: string;
  }> {
    return request<{
      id: string;
      supplier: string | null;
      comment: string | null;
      status: 'DRAFT' | 'POSTED' | 'CANCELED';
      updatedAt: string;
    }>(`/admin/warehouse/purchases/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(data),
    });
  },

  async postWarehousePurchase(
    initData: string | null,
    id: string,
    options?: { updateCostPrice?: boolean },
  ): Promise<{
    id: string;
    status: 'POSTED';
    postedAt: string;
    movementsCreated: number;
  }> {
    return request<{
      id: string;
      status: 'POSTED';
      postedAt: string;
      movementsCreated: number;
    }>(`/admin/warehouse/purchases/${id}/post`, {
      method: 'POST',
      initData,
      body: JSON.stringify(options || {}),
    });
  },

  async getWarehouseLots(
    initData: string | null,
    params?: {
      productId?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    items: Array<{
      id: string;
      productId: string;
      purchaseId: string | null;
      unitCost: number;
      qtyReceived: number;
      qtyRemaining: number;
      receivedAt: string;
      createdAt: string;
      purchase?: {
        id: string;
        supplier: string | null;
        postedAt: string | null;
      } | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<{
      items: Array<{
        id: string;
        productId: string;
        purchaseId: string | null;
        unitCost: number;
        qtyReceived: number;
        qtyRemaining: number;
        receivedAt: string;
        createdAt: string;
        purchase?: {
          id: string;
          supplier: string | null;
          postedAt: string | null;
        } | null;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/admin/warehouse/lots${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      initData,
      cache: 'no-store',
    });
  },

  async createWarehouseWriteOff(
    initData: string | null,
    data: { productId: string; qty: number; reason?: string },
  ): Promise<{
    id: string;
    productId: string;
    qty: number;
    totalCost: number;
    createdAt: string;
  }> {
    return request<{
      id: string;
      productId: string;
      qty: number;
      totalCost: number;
      createdAt: string;
    }>('/admin/warehouse/writeoffs', {
      method: 'POST',
      initData,
      body: JSON.stringify(data),
    });
  },

  async cancelWarehousePurchase(
    initData: string | null,
    id: string,
  ): Promise<{
    id: string;
    status: 'CANCELED';
  }> {
    return request<{
      id: string;
      status: 'CANCELED';
    }>(`/admin/warehouse/purchases/${id}/cancel`, {
      method: 'POST',
      initData,
    });
  },

  // Admin Lab Works
  async getAdminLabWorks(
    initData: string | null,
    query?: { q?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; page?: number; pageSize?: number }
  ): Promise<LabWorksListResponse> {
    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return request<LabWorksListResponse>(
      `/admin/lab/works${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        initData,
      }
    );
  },

  async getAdminLabWork(initData: string | null, id: string): Promise<LabWork> {
    return request<LabWork>(`/admin/lab/works/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminLabWork(initData: string | null, work: CreateLabWorkDto): Promise<LabWork> {
    return request<LabWork>('/admin/lab/works', {
      method: 'POST',
      initData,
      body: JSON.stringify(work),
    });
  },

  async updateAdminLabWork(initData: string | null, id: string, work: UpdateLabWorkDto): Promise<LabWork> {
    return request<LabWork>(`/admin/lab/works/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(work),
    });
  },

  async deleteAdminLabWork(initData: string | null, id: string): Promise<void> {
    return request<void>(`/admin/lab/works/${id}`, {
      method: 'DELETE',
      initData,
    });
  },

  async publishAdminLabWork(initData: string | null, id: string): Promise<LabWork> {
    return request<LabWork>(`/admin/lab/works/${id}/publish`, {
      method: 'POST',
      initData,
    });
  },

  async archiveAdminLabWork(initData: string | null, id: string): Promise<LabWork> {
    return request<LabWork>(`/admin/lab/works/${id}/archive`, {
      method: 'POST',
      initData,
    });
  },

  async addLabWorkMedia(initData: string | null, labWorkId: string, media: CreateLabWorkMediaDto): Promise<LabWorkMedia> {
    return request<LabWorkMedia>(`/admin/lab/works/${labWorkId}/media`, {
      method: 'POST',
      initData,
      body: JSON.stringify(media),
    });
  },

  async reorderLabWorkMedia(initData: string | null, labWorkId: string, mediaIds: string[]): Promise<LabWorkMedia[]> {
    return request<LabWorkMedia[]>(`/admin/lab/works/${labWorkId}/media/reorder`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify({ mediaIds }),
    });
  },

  async deleteLabWorkMedia(initData: string | null, labWorkId: string, mediaId: string): Promise<void> {
    return request<void>(`/admin/lab/works/${labWorkId}/media/${mediaId}`, {
      method: 'DELETE',
      initData,
    });
  },

  // Public Lab Works
  async getLabStatus(): Promise<{ maintenance: boolean }> {
    return request<{ maintenance: boolean }>('/lab/works/status', {
      method: 'GET',
    });
  },

  async getLabWorks(limit?: number): Promise<LabWork[]> {
    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.append('limit', String(limit));
    }
    const queryString = searchParams.toString();
    return request<LabWork[]>(`/lab/works${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  async getLabWork(id: string): Promise<LabWork> {
    return request<LabWork>(`/lab/works/${id}`, {
      method: 'GET',
    });
  },

  async rateLabWork(id: string, rating: number): Promise<{ ratingAvg: number; ratingCount: number; userRating: number | null }> {
    return request<{ ratingAvg: number; ratingCount: number; userRating: number | null }>(`/lab/works/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  // Settings
  async getMaintenanceStatus(): Promise<{ globalMaintenanceEnabled: boolean }> {
    return request<{ globalMaintenanceEnabled: boolean }>('/settings/maintenance', {
      method: 'GET',
    });
  },

  async updateMaintenanceStatus(initData: string | null, enabled: boolean): Promise<{ globalMaintenanceEnabled: boolean }> {
    return request<{ globalMaintenanceEnabled: boolean }>('/admin/settings/maintenance', {
      method: 'PATCH',
      initData,
      body: JSON.stringify({ globalMaintenanceEnabled: enabled }),
    });
  },

  // Admin Polet (Паллеты)
  async getAdminPoleti(initData: string | null): Promise<Polet[]> {
    return request<Polet[]>('/admin/polet', {
      method: 'GET',
      initData,
    });
  },

  async getAdminPolet(initData: string | null, id: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${id}`, {
      method: 'GET',
      initData,
    });
  },

  async createAdminPolet(initData: string | null, polet: CreatePoletDto): Promise<Polet> {
    return request<Polet>('/admin/polet', {
      method: 'POST',
      initData,
      body: JSON.stringify(polet),
    });
  },

  async updateAdminPolet(initData: string | null, id: string, polet: UpdatePoletDto): Promise<Polet> {
    return request<Polet>(`/admin/polet/${id}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(polet),
    });
  },

  async addPoziciya(initData: string | null, poletId: string, poziciya: CreatePoziciyaDto): Promise<Polet> {
    return request<Polet>(`/admin/polet/${poletId}/poziciya`, {
      method: 'POST',
      initData,
      body: JSON.stringify(poziciya),
    });
  },

  async updatePoziciya(initData: string | null, poletId: string, poziciyaId: string, poziciya: UpdatePoziciyaDto): Promise<Polet> {
    return request<Polet>(`/admin/polet/${poletId}/poziciya/${poziciyaId}`, {
      method: 'PATCH',
      initData,
      body: JSON.stringify(poziciya),
    });
  },

  async deletePoziciya(initData: string | null, poletId: string, poziciyaId: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${poletId}/poziciya/${poziciyaId}`, {
      method: 'DELETE',
      initData,
    });
  },

  async poluchenPolet(initData: string | null, id: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${id}/poluchen`, {
      method: 'POST',
      initData,
    });
  },

  async razobratPolet(initData: string | null, id: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${id}/razobrat`, {
      method: 'POST',
      initData,
    });
  },

  async sozdatTovar(initData: string | null, poletId: string, poziciyaId: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${poletId}/sozdat-tovar/${poziciyaId}`, {
      method: 'POST',
      initData,
    });
  },

  async provestiPolet(initData: string | null, id: string): Promise<Polet> {
    return request<Polet>(`/admin/polet/${id}/provesti`, {
      method: 'POST',
      initData,
    });
  },
};

