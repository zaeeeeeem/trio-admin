# Frontend Changes

## Current Errors & Warnings
- `npm run typecheck`
  - `src/components/products/ProductImageManager.tsx`: unused `Card` import and `onClose` prop; lingering local state/post handlers using implicit `any`.
  - `src/components/products/ProductVariantManager.tsx`: unused `onClose` prop; hook typings unresolved.
  - `src/pages/Dashboard.tsx`: `percent` inferred as `unknown`; unused `entry` variable.
  - `src/pages/Reviews.tsx`: unused `ImageIcon` import.
  - `src/types/index.ts`: `pagination` object violates declared string-index signature.
- `npm run lint`
  - Widespread `@typescript-eslint/no-explicit-any` violations across dashboard, admin tables, and shared types.
  - Numerous `@typescript-eslint/no-unused-vars` warnings for placeholder `error` variables in React Query-like flows.
  - Multiple `react-hooks/exhaustive-deps` warnings (`fetchImages`, `fetchVariants`, `fetchAdmins`, etc.).
  - `react-refresh/only-export-components` warning in `src/context/AuthContext.tsx`.
- `npm run build`
  - `caniuse-lite` outdated informational notice.
  - Rollup warning: `dist/assets/index-DRhSlSjS.js` > 500 kB after minification; consider code splitting.

## Migration Map
- Prefer `image.publicUrl` over legacy `image.imageUrl` when rendering thumbnails or hero images.
- Image uploads now target `POST /api/products/:productId/images/upload` with `multipart/form-data` (`file`, `isPrimary`, `alt`, `sort_order`) rather than JSON payloads.
- Image metadata updates flow through `PATCH /api/products/:productId/images/:imageId`; deletion accepts optional `deleteFile=true`.
- Product payloads expose `images[]` with `{ publicUrl, alt, sortOrder, isPrimary }` and SKU-centric `variants[]`; keep `legacyVariantAttributes` for backward compatibility.
- Variant CRUD aligns with `POST/GET/PATCH/DELETE /api/products/:productId/variants` using `{ sku, price, stock, status, attributes[] }`.
- Pagination structures differ per endpoint:
  - Lists (`/api/products`) → `{ page, limit, totalPages, totalItems }`.
  - Cursor-based lists (`/images`, `/variants`) → `{ limit, nextCursor }`.
- All responses wrap data in `{ success, message, data }`; axios layer should unwrap on success and throw when `success` is false.

