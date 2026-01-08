# Analytics Dashboard Setup Guide

## ✅ Implementation Complete

All components have been implemented:

### Backend (NestJS)
- ✅ Prisma schema with analytics models
- ✅ Migration file created
- ✅ Analytics module with all services
- ✅ Admin-protected analytics endpoints
- ✅ Public event tracking endpoint
- ✅ Telegram webhook handler
- ✅ Cron job for subscriber snapshots

### Frontend (Next.js)
- ✅ Admin analytics page with charts and tables
- ✅ Analytics helper for event tracking
- ✅ Navigation updated with Analytics link

## 🚀 Setup Steps

### 1. Install Dependencies

```bash
cd apps/api
pnpm add @nestjs/schedule
```

### 2. Apply Migration

```bash
cd apps/api
pnpm prisma migrate deploy
# Or for development:
pnpm prisma migrate dev
```

### 3. Environment Variables

Add to `apps/api/.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@your_channel_or_numeric_id
```

**Note:** `TELEGRAM_CHANNEL_ID` can be:
- Numeric ID: `-1001234567890`
- Username: `@asked_channel`
- Username without @: `asked_channel`

### 4. Configure Telegram Webhook

The bot must be an admin of the channel to receive `channel_post` updates.

Set webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-api.onrender.com/telegram/webhook",
    "allowed_updates": ["channel_post"]
  }'
```

### 5. Add Event Tracking to Mini App

Import and use the analytics helper in your pages:

```typescript
import { analytics } from '@/lib/analytics';

// On catalog page
useEffect(() => {
  analytics.trackPageView();
}, []);

// On product detail page
useEffect(() => {
  if (productId) {
    analytics.trackProductView(productId);
  }
}, [productId]);

// On add to cart
const handleAddToCart = () => {
  analytics.trackAddToCart(productId);
  // ... rest of cart logic
};

// On checkout start
const handleCheckout = () => {
  analytics.trackCheckoutStarted();
  // ... rest of checkout logic
};

// On purchase complete
const handlePurchaseComplete = () => {
  analytics.trackPurchase({ orderId: order.id });
};
```

### 6. Attribution Tracking

The analytics helper automatically extracts attribution from URL parameters:

- `?utm_source=telegram` - Traffic source
- `?utm_campaign=summer_sale` - Campaign name
- `?post_id=123` - Telegram post ID

Example link in Telegram post:
```
https://your-webapp.onrender.com?utm_source=telegram&utm_campaign=summer_sale&post_id=123
```

## 📊 Available Analytics Endpoints

### Admin Endpoints (require authentication)

1. **GET /admin/analytics/overview**
   - Returns: KPI overview (subscribers, revenue, orders, conversion, AOV)
   - Query params: `from`, `to`, `granularity`

2. **GET /admin/analytics/telegram/subscribers**
   - Returns: Time-series subscriber data
   - Query params: `from`, `to`, `granularity` (hour/day/week/month)

3. **GET /admin/analytics/telegram/posts/top**
   - Returns: Top posts by views
   - Query params: `limit`, `from`, `to`

4. **GET /admin/analytics/shop/products/top**
   - Returns: Top products
   - Query params: `metric` (orders/revenue/views), `limit`, `from`, `to`

5. **GET /admin/analytics/funnel**
   - Returns: Conversion funnel data
   - Query params: `from`, `to`

### Public Endpoints

1. **POST /public/events**
   - Body: Event data (see `AppEventDto`)
   - No authentication required
   - Rate-limited (can be enhanced)

2. **POST /telegram/webhook**
   - Telegram webhook endpoint
   - Processes `channel_post` updates

## 🔄 How It Works

### Subscriber Tracking
- Cron job runs hourly (`@Cron(CronExpression.EVERY_HOUR)`)
- Calls Telegram Bot API `getChatMemberCount`
- Stores snapshot with idempotency (one per hour)
- Growth calculated as delta between snapshots

### Post Tracking
- Webhook receives `channel_post` updates from Telegram
- Stores/updates post data (views, forwards, text)
- Only processes posts from configured `TELEGRAM_CHANNEL_ID`

### Event Tracking
- Frontend calls `POST /public/events` on user actions
- Events stored with attribution (source, campaign, postId)
- Used for funnel analysis and product performance

### Limitations
- **Subscribers**: Cannot list individual subscribers (Telegram API limitation)
- **New Subscribers**: Calculated as delta between snapshots (approximation)
- **Post Views**: Only available if bot receives channel_post updates
- **Attribution**: Requires UTM parameters or startapp params in links

## 📝 Notes

- All analytics endpoints are admin-protected
- Event tracking fails silently (won't break app)
- Cron job requires `@nestjs/schedule` package
- Webhook must be configured for post tracking to work
- Migration is production-safe (no data loss)

## 🐛 Troubleshooting

### Cron job not running
- Check that `@nestjs/schedule` is installed
- Verify `ScheduleModule.forRoot()` is imported in `AnalyticsModule`
- Check logs for errors

### Webhook not receiving updates
- Verify bot is admin of channel
- Check webhook URL is correct
- Ensure `allowed_updates` includes `channel_post`

### No subscriber data
- Check `TELEGRAM_CHANNEL_ID` is set correctly
- Verify bot has permission to call `getChatMemberCount`
- Wait for cron job to run (hourly)

### Events not tracking
- Check browser console for errors
- Verify API endpoint is accessible
- Check network tab for failed requests


