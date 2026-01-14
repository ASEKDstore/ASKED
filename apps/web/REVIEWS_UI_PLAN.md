# Reviews UI Implementation Plan

## Overview
Implement modern reviews UI for product pages with star ratings, text reviews, photo/video attachments, and bottom sheet UX.

## Tasks

### Task A: Product Page - Rating Summary
- Show average rating (e.g. 4.5 ⭐)
- Show reviews count ("23 отзыва")
- Star visualization (filled + half stars)

### Task B: Reviews List
- List approved reviews under product description
- Each review: stars, text, media gallery, username + date
- Click media → full-screen viewer (swipe)

### Task C: Add Review UI
- Button "Оставить отзыв"
- Bottom Sheet with:
  - Star selector (1-5)
  - Textarea
  - Upload media (photo/video URLs)
- Submit POST /reviews
- Show "Отзыв отправлен на модерацию"

### Task D: Upload Handling
- URL inputs (consistent with existing pattern)
- Max 5 files
- Image/video only
- Show previews before submit

## File Changes

1. **API Types** (`apps/web/src/lib/api.ts`)
   - Add Review, ReviewMedia interfaces
   - Update Product interface (averageRating, reviewsCount)
   - Add review API methods

2. **Star Rating Component** (`apps/web/src/components/reviews/StarRating.tsx`)
   - Display stars (filled/half/empty)
   - Interactive star selector

3. **Reviews List Component** (`apps/web/src/components/reviews/ReviewsList.tsx`)
   - Display reviews with stars, text, media, user info

4. **Media Gallery Component** (`apps/web/src/components/reviews/MediaGallery.tsx`)
   - Grid display
   - Click to open full-screen viewer

5. **Media Viewer Component** (`apps/web/src/components/reviews/MediaViewer.tsx`)
   - Full-screen image/video viewer
   - Swipe navigation

6. **Add Review Bottom Sheet** (`apps/web/src/components/reviews/AddReviewSheet.tsx`)
   - Bottom sheet (using framer-motion like ProductSheet)
   - Star selector, textarea, media upload inputs

7. **Product Page Updates** (`apps/web/src/app/p/[id]/page.tsx`)
   - Add rating summary
   - Add reviews section
   - Add "Оставить отзыв" button

