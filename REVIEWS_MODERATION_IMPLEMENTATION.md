# Reviews Moderation and Replies Implementation

## Overview
This document outlines the implementation of reviews moderation and replies functionality for the ASKED miniapp. The implementation includes:
- Prisma schema updates (ReviewReply model)
- Backend endpoints for replies (add/delete)
- Admin reviews moderation page
- Reply display on product pages

## 1. Plan

### TASK A - Backend: Store Replies
- ✅ Add ReviewReply model to Prisma schema
- ✅ Add reply endpoints: POST /admin/reviews/:id/reply, DELETE /admin/reviews/:id/reply
- ✅ Update GET /products/:id/reviews to include replies
- ⏳ Create migration (user will run `prisma migrate dev`)

### TASK B - Admin Page: Reviews Moderation
- ⏳ Add admin reviews page route
- ⏳ Add "Отзывы" tab to admin navigation
- ⏳ Create reviews moderation page with:
  - Pending reviews queue
  - Approve/Reject buttons
  - Reply form
  - Search by product/username
  - Filter: Pending/Approved/Rejected

## 2. Backend Changes

### 2.1 Prisma Schema (`apps/api/prisma/schema.prisma`)

Added ReviewReply model:
```prisma
model ReviewReply {
  id        String   @id @default(cuid())
  reviewId  String   @unique
  adminId   String?  // Optional admin user ID
  text      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@map("review_replies")
}
```

Updated Review model to include reply relation:
```prisma
model Review {
  // ... existing fields
  reply     ReviewReply?
  // ... existing fields
}
```

### 2.2 DTOs

**`apps/api/src/reviews/dto/create-review-reply.dto.ts`** (New):
```typescript
import { z } from 'zod';

export const createReviewReplySchema = z.object({
  text: z.string().min(1, 'Reply text is required').max(2000, 'Reply text must be less than 2000 characters'),
});

export type CreateReviewReplyDto = z.infer<typeof createReviewReplySchema>;
```

**`apps/api/src/reviews/dto/review.dto.ts`** (Updated):
- Added `reviewReplyDtoSchema`
- Updated `reviewDtoSchema` to include `reply: reviewReplyDtoSchema.nullable().optional()`
- Updated `reviewListItemDtoSchema` to include `reply: reviewReplyDtoSchema.nullable().optional()`

### 2.3 Service (`apps/api/src/reviews/reviews.service.ts`)

Added methods:
- `addReply(reviewId, createReplyDto, adminId?)` - Add or update a reply
- `deleteReply(reviewId)` - Delete a reply

Updated methods:
- `findByProduct` - Now includes `reply: true` in include
- `findAll` - Now includes `reply: true` in include
- `findByUser` - Now includes `reply: true` in include
- `approve` - Now includes `reply: true` in include
- `reject` - Now includes `reply: true` in include
- `mapToDto` - Now includes reply mapping
- `mapToListItemDto` - Now includes reply mapping

### 2.4 Controller (`apps/api/src/reviews/admin-reviews.controller.ts`)

Added endpoints:
- `POST /admin/reviews/:id/reply` - Add or update a reply
- `DELETE /admin/reviews/:id/reply` - Delete a reply

Updated imports:
- Added `UsersService` for getting admin user ID
- Added `Delete` decorator from `@nestjs/common`
- Added `Body`, `Req` decorators
- Added `createReviewReplySchema` import

### 2.5 Migration

The user should run:
```bash
cd apps/api
pnpm prisma migrate dev --name add_review_replies
```

## 3. Frontend Changes (TODO)

### 3.1 API Client (`apps/web/src/lib/api.ts`)
- Add reply methods:
  - `addReviewReply(initData, reviewId, text)`
  - `deleteReviewReply(initData, reviewId)`
- Update Review interface to include reply

### 3.2 Admin Navigation (`apps/web/src/components/admin/AdminNav.tsx`)
- Add "Отзывы" navigation item

### 3.3 Admin Reviews Page (`apps/web/src/app/admin/reviews/page.tsx`)
- Create new page with:
  - Reviews list table
  - Approve/Reject buttons
  - Reply form
  - Search and filters

## 4. Verification Steps

1. **Backend**:
   - ✅ Run `pnpm --filter api build` - should pass
   - Run migration: `cd apps/api && pnpm prisma migrate dev`
   - Test endpoints:
     - POST /admin/reviews/:id/reply
     - DELETE /admin/reviews/:id/reply
     - GET /products/:id/reviews (should include replies)

2. **Frontend**:
   - Run `pnpm --filter web build` - should pass
   - Navigate to /admin/reviews
   - Test approve/reject/reply functionality
   - Verify replies appear on product pages

