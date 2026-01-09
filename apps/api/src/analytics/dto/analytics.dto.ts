export interface AnalyticsOverviewDto {
  subscribersNow: number;
  subscribersGrowth: number; // Delta from previous period
  ordersCount: number;
  revenue: number; // Total revenue in RUB
  conversion: number; // Percentage (0-100)
  aov: number; // Average Order Value
  period: {
    from: string;
    to: string;
  };
}

export interface TelegramSubscribersDataPoint {
  date: string;
  count: number;
  growth: number; // Delta from previous point
}

export interface TelegramSubscribersResponse {
  data: TelegramSubscribersDataPoint[];
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface TelegramPostDto {
  id: string;
  channelId: string;
  messageId: number;
  date: string;
  textExcerpt: string | null;
  views: number;
  forwards: number;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramPostsResponse {
  items: TelegramPostDto[];
  total: number;
}

export interface TopProductDto {
  productId: string;
  productTitle: string;
  metric: number; // orders count, revenue, or views
  metricType: 'orders' | 'revenue' | 'views';
}

export interface TopProductsResponse {
  items: TopProductDto[];
}

export interface FunnelDataPoint {
  stage: string;
  count: number;
  percentage: number; // Percentage of previous stage
}

export interface FunnelResponse {
  funnel: FunnelDataPoint[];
  period: {
    from: string;
    to: string;
  };
}




