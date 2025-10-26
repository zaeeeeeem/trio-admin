export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PagePagination = {
  page: number;
  limit: number;
  totalPages: number;
  total?: number;
  totalItems?: number;
};

export type CursorPagination = {
  limit: number;
  nextCursor: string | null;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: PagePagination;
}>;

export type CursorPaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: CursorPagination;
}>;

export type VariantStatus = 'draft' | 'active' | 'archived';

export type ProductSort = 'price_asc' | 'price_desc' | 'rating' | 'name';

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductImage {
  _id: string;
  productId: string;
  publicUrl?: string;
  viewUrl?: string;
  isPrimary: boolean;
  alt?: string;
  sortOrder?: number;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  storageKey?: string;
  etag?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id: string;
  id?: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  status: VariantStatus;
  attributes: VariantAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  categoryId?: string;
  productType?: string;
  price?: number;
  discountPercent?: number;
  discountedPrice?: number;
  quantity?: number;
  status?: VariantStatus;
  rating?: number;
  totalRatings?: number;
  keywords?: string[] | string;
  features?: string[] | string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  legacyVariantAttributes?: VariantAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: ProductSort;
}

export interface ImageListParams {
  limit?: number;
  cursor?: string;
}

export interface UploadProductImagePayload {
  files?: File[];
  file?: File;
  isPrimary?: boolean;
  primaryIndex?: number;
  alt?: string;
  sortOrder?: number;
}

export interface UpdateProductImagePayload {
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface DeleteProductImageParams {
  deleteFile?: boolean;
}

export interface VariantListFilters {
  limit?: number;
  cursor?: string;
  sku?: string;
  status?: VariantStatus;
}

export interface CreateVariantPayload {
  sku: string;
  price: number;
  stock: number;
  status: VariantStatus;
  attributes?: VariantAttribute[];
}

export interface UpdateVariantPayload {
  sku?: string;
  price?: number;
  stock?: number;
  status?: VariantStatus;
  attributes?: VariantAttribute[];
}
