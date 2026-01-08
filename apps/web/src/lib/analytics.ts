import { api } from './api';
import { getInitData } from './telegram';

// Helper to get session ID (persists across page reloads)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Helper to extract attribution from URL
function getAttributionFromUrl(): { source?: string; campaign?: string; postId?: string } {
  if (typeof window === 'undefined') return {};
  
  try {
    const url = new URL(window.location.href);
    const source = url.searchParams.get('utm_source') || url.searchParams.get('source') || 'telegram';
    const campaign = url.searchParams.get('utm_campaign') || url.searchParams.get('campaign') || undefined;
    const postId = url.searchParams.get('post_id') || url.searchParams.get('utm_content') || undefined;
    
    return { source, campaign, postId };
  } catch {
    return { source: 'telegram' };
  }
}

// Helper to get Telegram user ID from initData
function getTelegramUserId(): string | undefined {
  try {
    const initData = getInitData();
    if (!initData) return undefined;
    
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(decodeURIComponent(userStr)) as unknown;
      if (user && typeof user === 'object' && 'id' in user) {
        const userId = (user as { id?: unknown }).id;
        return userId != null ? String(userId) : undefined;
      }
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

export interface TrackEventOptions {
  eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_STARTED' | 'PURCHASE';
  productId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    const userId = getTelegramUserId();
    const sessionId = getSessionId();
    const attribution = getAttributionFromUrl();

    await api.trackEvent({
      eventType: options.eventType,
      userId,
      sessionId,
      productId: options.productId,
      source: attribution.source,
      campaign: attribution.campaign,
      postId: attribution.postId,
      metadata: options.metadata,
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.warn('Analytics tracking failed:', error);
  }
}

  // Convenience functions
export const analytics = {
  trackPageView: (metadata?: Record<string, unknown>) =>
    trackEvent({ eventType: 'PAGE_VIEW', metadata }),

  trackProductView: (productId: string, metadata?: Record<string, unknown>) =>
    trackEvent({ eventType: 'PRODUCT_VIEW', productId, metadata }),

  trackAddToCart: (productId: string, metadata?: Record<string, unknown>) =>
    trackEvent({ eventType: 'ADD_TO_CART', productId, metadata }),

  trackCheckoutStarted: (metadata?: Record<string, unknown>) =>
    trackEvent({ eventType: 'CHECKOUT_STARTED', metadata }),

  trackPurchase: (metadata?: Record<string, unknown>) =>
    trackEvent({ eventType: 'PURCHASE', metadata }),
};

