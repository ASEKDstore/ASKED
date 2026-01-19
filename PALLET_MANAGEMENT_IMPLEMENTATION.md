# Паллеты (Pallet) Management Implementation Summary

## ✅ Completed Features

### A) Delete Pallets (Soft Delete)
- ✅ Added `deletedAt` and `deletedBy` fields to `Polet` model in Prisma schema
- ✅ Implemented soft delete in `AdminPoletService.delete()` method
- ✅ Added `DELETE /admin/polet/:id` endpoint
- ✅ Updated `findAll()` and `findOne()` to filter deleted pallets by default
- ✅ Added `includeDeleted` query parameter for admin debugging
- ✅ Frontend: Added delete button to pallet list page with confirmation dialog

### B) Delete Products (Safe Soft Delete)
- ✅ Added `deletedAt` field to `Product` model in Prisma schema
- ✅ Updated `AdminProductsService.delete()` to use soft delete (sets `deletedAt` and `status: ARCHIVED`)
- ✅ Checks for relations (orders, lots, movements, reviews) before deletion
- ✅ Updated all product queries to exclude `deletedAt` by default
- ✅ Public API (`ProductsService`) filters out deleted products
- ✅ Frontend: Added delete product functionality in pallet detail page

### C) Fixed "Create Product from Pallet Item"
- ✅ Fixed `sozdatTovar()` method to use transaction for atomicity
- ✅ Properly creates product with:
  - `title` from `poziciya.nazvanie`
  - `costPrice` from `sebestoimostItogoRub` (converted to cents)
  - `stock: 0` (will be set when pallet is "провести")
  - `status: DRAFT`
  - Links `sourcePoletId` and `sourcePoziciyaId`
- ✅ Updates `poziciya.tovarId` to link the product
- ✅ Returns updated pallet with product data

### D) Enhanced Product Management UI in Pallet Detail
- ✅ Improved table layout showing:
  - Название позиции
  - Кол-во (qty)
  - Себестоимость за 1 шт
  - Итоговая себестоимость позиции
- ✅ Product information display:
  - Product title with link to edit page
  - Цена продажи (editable inline)
  - Количество на складе (stock)
  - Статус (ACTIVE/DRAFT/ARCHIVED)
  - Quick actions: "Изменить цену", "Открыть товар", "Удалить товар"
- ✅ Inline price editing with save/cancel buttons
- ✅ Delete product button with confirmation dialog

### E) Backend Endpoints
- ✅ `GET /admin/polet/:id` - includes full product data (stock, status, sku, costPrice, deletedAt)
- ✅ `PATCH /admin/products/:id` - supports partial updates (price, stock, status, costPrice)
- ✅ `DELETE /admin/polet/:id` - soft delete pallet
- ✅ `DELETE /admin/products/:id` - soft delete product

## 📋 Database Migration Required

**IMPORTANT:** You need to create and run a Prisma migration:

```bash
cd apps/api
npx prisma migrate dev --name add_soft_delete_to_polet_and_product
```

This will add:
- `Polet.deletedAt` (DateTime?)
- `Polet.deletedBy` (String?)
- `Product.deletedAt` (DateTime?)
- Indexes on `deletedAt` fields

## 🔧 Files Modified

### Backend (API)
1. `apps/api/prisma/schema.prisma` - Added soft delete fields
2. `apps/api/src/admin/admin-polet.service.ts` - Delete method, filtering
3. `apps/api/src/admin/admin-polet.controller.ts` - DELETE endpoint
4. `apps/api/src/admin/admin-products.service.ts` - Improved delete, filtering
5. `apps/api/src/admin/dto/polet.dto.ts` - Extended product data in DTO
6. `apps/api/src/admin/dto/admin-product-query.dto.ts` - Added `includeDeleted`
7. `apps/api/src/admin/dto/update-admin-product.dto.ts` - Added `costPrice`, `packagingCost`
8. `apps/api/src/products/products.service.ts` - Filter deleted products

### Frontend (Web)
1. `apps/web/src/lib/api.ts` - Added `deleteAdminPolet`, updated interfaces
2. `apps/web/src/app/admin/polet/page.tsx` - Delete button in list
3. `apps/web/src/app/admin/polet/[id]/page.tsx` - Enhanced product management UI

## 🧪 Verification Checklist

### 1. Create Pallet with Items
- [ ] Create a new pallet
- [ ] Mark as "Получен" (RECEIVED)
- [ ] Add positions (позиции)
- [ ] Verify себестоимость calculation

### 2. Create Product from Pallet Item
- [ ] Mark pallet as "Разобран" (DISASSEMBLED)
- [ ] Click "Создать товар" on a position
- [ ] Verify:
  - Product is created
  - Product is linked to position (`tovarId` set)
  - Product appears immediately in UI
  - Product has correct `costPrice` (from себестоимостьИтогоRub)

### 3. Edit Product Price Inline
- [ ] Click "Изменить цену" on a product in pallet detail
- [ ] Enter new price
- [ ] Click save
- [ ] Verify price is updated and persisted

### 4. Delete Product
- [ ] Click delete button on a product in pallet detail
- [ ] Confirm deletion
- [ ] Verify:
  - Product disappears from public catalog
  - Product is marked as ARCHIVED in admin
  - Product still visible in admin with `deletedAt` set

### 5. Delete Pallet
- [ ] Click delete button on a pallet in list
- [ ] Confirm deletion
- [ ] Verify:
  - Pallet is hidden from list (not hard deleted)
  - `deletedAt` is set
  - Can view with `includeDeleted=true` query param

### 6. Build & Test
- [ ] Run `pnpm --filter api build` - should succeed
- [ ] Run `pnpm --filter web build` - should succeed
- [ ] No 500 errors in API
- [ ] All endpoints return proper error messages

## 🚨 Important Notes

1. **Migration Required**: The Prisma schema changes require a migration. Run it before deploying.

2. **Soft Delete Only**: All deletions are soft deletes for data safety:
   - Pallets: Set `deletedAt`, hidden from lists
   - Products: Set `deletedAt` and `status: ARCHIVED`, hidden from public catalog

3. **POSTED Pallets**: Pallets with status `POSTED` can only be soft-deleted (they have inventory movements).

4. **Product Relations**: Products with orders/lots/movements are soft-deleted only (never hard deleted).

5. **Price Updates**: Product price can be updated inline in pallet detail page. Stock and status can be updated via the product edit page.

6. **No `any` Types**: All code uses proper TypeScript types, no `any` usage.

## 📝 Next Steps (Optional Enhancements)

1. Add "Restore" functionality for deleted pallets/products
2. Add bulk delete for pallets
3. Add export functionality for pallet data
4. Add product stock update directly from pallet detail page
5. Add cost price override in pallet item UI

