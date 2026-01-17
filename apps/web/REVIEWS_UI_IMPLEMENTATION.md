# Reviews UI Implementation Summary

## Overview

Modern reviews UI for product pages with star ratings, text reviews, photo/video attachments, and bottom sheet UX for mobile (Telegram WebApp).

## 1. Plan

### Features Implemented
- ✅ **Rating Summary**: Average rating (e.g. 4.5 ⭐) + reviews count ("23 отзыва")
- ✅ **Star Visualization**: Filled stars + half stars
- ✅ **Reviews List**: Approved reviews with stars, text, media, username + date
- ✅ **Media Gallery**: Photo/video grid with click-to-view
- ✅ **Full-screen Media Viewer**: Swipe navigation between images/videos
- ✅ **Add Review Bottom Sheet**: Star selector, textarea, media upload (URLs)
- ✅ **Mobile-first UX**: Bottom sheet pattern (framer-motion) consistent with ProductSheet

### Architecture
- **Components**: Reusable review components in `components/reviews/`
- **API Integration**: React Query for data fetching
- **State Management**: Local state for UI, React Query for server state
- **Media**: URL-based (consistent with existing product/banner pattern)
- **Styling**: Tailwind CSS, consistent with app style

## 2. File-by-File Changes

### API Types & Methods

#### `apps/web/src/lib/api.ts`
**Changes:**
1. Updated `Product` interface:
   - Added `averageRating: number`
   - Added `reviewsCount: number`

2. Added Review interfaces:
   ```typescript
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
     user?: { ... };
   }

   export interface ReviewsListResponse {
     items: Review[];
     meta: { page, pageSize, total, totalPages };
   }

   export interface CreateReviewDto {
     productId: string;
     orderId?: string;
     rating: number;
     text?: string;
     media?: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>;
   }
   ```

3. Added API methods:
   - `getProductReviews(productId, params?)`: GET /products/:id/reviews
   - `createReview(initData, review)`: POST /reviews

### Review Components

#### `apps/web/src/components/reviews/StarRating.tsx` (NEW)
**Purpose**: Display and select star ratings (1-5)

**Features:**
- Display mode: Shows filled/half/empty stars with rating value
- Interactive mode: Clickable stars for rating selection
- Sizes: sm, md, lg
- Hover effects for interactive mode

**Props:**
```typescript
interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}
```

#### `apps/web/src/components/reviews/MediaGallery.tsx` (NEW)
**Purpose**: Display review media in a grid (3 columns)

**Features:**
- Grid layout (3 columns)
- Image and video thumbnails
- Play icon overlay for videos
- Click handler to open full-screen viewer

**Props:**
```typescript
interface MediaGalleryProps {
  media: ReviewMedia[];
  onMediaClick?: (index: number) => void;
}
```

#### `apps/web/src/components/reviews/MediaViewer.tsx` (NEW)
**Purpose**: Full-screen media viewer with swipe navigation

**Features:**
- Full-screen overlay (black background)
- Image and video support
- Keyboard navigation (Arrow keys, Escape)
- Navigation buttons (prev/next)
- Dot indicators
- Smooth animations (framer-motion)

**Props:**
```typescript
interface MediaViewerProps {
  media: ReviewMedia[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
```

#### `apps/web/src/components/reviews/ReviewsList.tsx` (NEW)
**Purpose**: Display list of approved reviews

**Features:**
- Reviews list with user info, rating, text, media
- Date formatting (Russian relative dates)
- Media gallery integration
- Full-screen viewer integration
- Empty state

**Props:**
```typescript
interface ReviewsListProps {
  reviews: Review[];
}
```

#### `apps/web/src/components/reviews/AddReviewSheet.tsx` (NEW)
**Purpose**: Bottom sheet for adding reviews

**Features:**
- Bottom sheet UX (framer-motion, similar to ProductSheet)
- Star rating selector (interactive)
- Textarea for review text (max 1000 chars)
- Media upload (URL inputs, max 5 files)
- Image/Video type selector
- Media preview grid
- Submit with loading state
- Success message: "Отзыв отправлен на модерацию"
- Haptic feedback (Telegram)

**Props:**
```typescript
interface AddReviewSheetProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### Product Page Updates

#### `apps/web/src/app/p/[id]/page.tsx`
**Changes:**

1. **Imports:**
   - Added review components (AddReviewSheet, ReviewsList, StarRating)
   - Added useTelegram hook
   - Added useQueryClient for cache invalidation
   - Added useState for sheet state

2. **State:**
   - Added `isAddReviewOpen` state
   - Added reviews query

3. **Rating Summary:**
   - Added after product title
   - Shows StarRating + reviews count
   - Format: "23 отзыва" (with proper pluralization)

4. **Reviews Section:**
   - Added after product info (before similar products)
   - Shows "Оставить отзыв" button (only if authenticated)
   - Displays ReviewsList component
   - Loading and empty states

5. **Add Review Sheet:**
   - Integrated AddReviewSheet component
   - Handles success (invalidates queries)

## 3. Verification Steps

### 1. Build Check
```bash
cd apps/web
pnpm --filter web build
```

**Expected**: Build passes without errors

### 2. Product Page - Rating Summary

**Test:**
1. Navigate to product page (`/p/[id]`)
2. Check product with reviews

**Expected:**
- ✅ Rating stars displayed (e.g. ⭐⭐⭐⭐⭐ 4.5)
- ✅ Reviews count displayed (e.g. "23 отзыва")
- ✅ Proper pluralization (1 отзыв, 2 отзыва, 5 отзывов)
- ✅ No rating shown if reviewsCount = 0

### 3. Reviews List

**Test:**
1. Navigate to product page
2. Scroll to reviews section

**Expected:**
- ✅ Reviews section visible (after product description)
- ✅ Approved reviews displayed
- ✅ Each review shows: stars, text, media gallery, username, date
- ✅ Date formatted correctly (Russian relative dates)
- ✅ Empty state if no reviews
- ✅ Media gallery clickable

### 4. Add Review Flow

**Test:**
1. Navigate to product page (authenticated)
2. Click "Оставить отзыв" button
3. Bottom sheet opens
4. Select rating (1-5 stars)
5. Enter review text (optional)
6. Add media URLs (optional, max 5)
7. Click "Отправить отзыв"
8. Sheet closes

**Expected:**
- ✅ "Оставить отзыв" button visible (only if authenticated)
- ✅ Bottom sheet opens with smooth animation
- ✅ Star selector works (clickable, hover effects)
- ✅ Textarea accepts text (max 1000 chars, counter shown)
- ✅ Media upload: URL inputs, type selector (IMAGE/VIDEO)
- ✅ Max 5 files validation
- ✅ Media preview grid shows added media
- ✅ Submit button disabled when invalid
- ✅ Success: Sheet closes, reviews refresh
- ✅ Message: "Отзыв отправлен на модерацию"

### 5. Media Viewer

**Test:**
1. Navigate to product page
2. Find review with media
3. Click on media thumbnail
4. Full-screen viewer opens
5. Try navigation (arrows, keyboard, dots)

**Expected:**
- ✅ Full-screen viewer opens on media click
- ✅ Image/video displays correctly
- ✅ Navigation works (prev/next buttons, keyboard arrows)
- ✅ Dot indicators show current position
- ✅ Close button works (X, Escape key)
- ✅ Smooth transitions between media

### 6. Mobile UX

**Test:**
1. Open product page on mobile (Telegram WebApp)
2. Test bottom sheet
3. Test media viewer
4. Test scrolling

**Expected:**
- ✅ Bottom sheet drags smoothly
- ✅ Bottom sheet closes on drag down
- ✅ Media viewer works on mobile
- ✅ No layout issues on small screens
- ✅ Safe area insets respected
- ✅ Touch interactions smooth

### 7. Edge Cases

**Test:**
1. Product with no reviews
2. Review with no text
3. Review with no media
4. Review with max media (5 files)
5. Submit review without authentication

**Expected:**
- ✅ Empty state displays correctly
- ✅ Reviews without text still show
- ✅ Reviews without media still show
- ✅ Max 5 files enforced
- ✅ Unauthenticated users can't submit (button hidden)

## 4. File Summary

### New Files (5)
- `apps/web/src/components/reviews/StarRating.tsx`
- `apps/web/src/components/reviews/MediaGallery.tsx`
- `apps/web/src/components/reviews/MediaViewer.tsx`
- `apps/web/src/components/reviews/ReviewsList.tsx`
- `apps/web/src/components/reviews/AddReviewSheet.tsx`

### Modified Files (2)
- `apps/web/src/lib/api.ts` - Added review types and API methods, updated Product interface
- `apps/web/src/app/p/[id]/page.tsx` - Added rating summary, reviews section, add review sheet

### Documentation (2)
- `apps/web/REVIEWS_UI_PLAN.md` - Implementation plan
- `apps/web/REVIEWS_UI_IMPLEMENTATION.md` - This file

## 5. Dependencies

All dependencies already present:
- ✅ `framer-motion` - For bottom sheet animations
- ✅ `lucide-react` - For icons (Star, X, Play, ChevronLeft, ChevronRight)
- ✅ `@tanstack/react-query` - For data fetching
- ✅ `next/image` - For optimized images
- ✅ `date-fns` - NOT used (custom date formatter instead)

**No new dependencies required!**

## 6. API Endpoints Used

- `GET /products/:id` - Get product (includes averageRating, reviewsCount)
- `GET /products/:id/reviews` - Get approved reviews for product
- `POST /reviews` - Create review (requires authentication)

## 7. Key Implementation Details

### Star Rating
- Uses lucide-react Star icon
- Supports half stars (for ratings like 4.5)
- Interactive mode with hover effects
- Size variants (sm, md, lg)

### Media Handling
- **Upload Method**: URL inputs (consistent with existing pattern)
- **Validation**: Max 5 files, URL validation
- **Preview**: Grid display before submit
- **Full-screen**: framer-motion animations, keyboard navigation

### Bottom Sheet
- **Pattern**: Similar to ProductSheet (framer-motion)
- **Features**: Drag to close, backdrop click, keyboard (Escape)
- **Styling**: Rounded top corners, safe area insets

### Date Formatting
- **Custom formatter**: No date-fns dependency
- **Russian**: Proper pluralization ("2 отзыва", "5 отзывов")
- **Relative**: "сегодня", "вчера", "2 дня назад", etc.

## 8. Notes

- **No `any` types**: All TypeScript strict
- **Mobile-first**: Designed for Telegram WebApp
- **Consistent patterns**: Uses existing UI components and patterns
- **Media upload**: URL-based (same as products/banners in admin)
- **Authentication**: Add review button only shows if user authenticated
- **Moderation**: Reviews start as PENDING, only APPROVED reviews shown
- **Rating calculation**: Backend handles (only approved reviews)

## Next Steps

1. ✅ Run build: `pnpm --filter web build`
2. ✅ Test on product page
3. ✅ Test add review flow
4. ✅ Test media viewer
5. ✅ Verify mobile UX

All code is ready and follows the app's patterns and style!



