export interface NotificationDto {
  id: string; // UserNotification ID
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
  items: NotificationDto[];
  nextCursor?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  updated: number;
}

