import type {
  ImageListParams,
  ProductListFilters,
  VariantListFilters,
} from '../types/api';

const emptyObject = Object.freeze({}) as Record<string, never>;

export const authKeys = {
  all: ['auth'] as const,
  profile: () => ['auth', 'profile'] as const,
};

export const productKeys = {
  all: ['products'] as const,
  list: (filters?: ProductListFilters) =>
    ['products', 'list', filters ?? emptyObject] as const,
  detail: (slugOrId: string) => ['products', 'detail', slugOrId] as const,
  images: {
    all: (productId: string) => ['products', productId, 'images'] as const,
    list: (productId: string, params?: ImageListParams) =>
      ['products', productId, 'images', params ?? emptyObject] as const,
    detail: (productId: string, imageId: string) =>
      ['products', productId, 'images', imageId] as const,
  },
  variants: {
    all: (productId: string) => ['products', productId, 'variants'] as const,
    list: (productId: string, filters?: VariantListFilters) =>
      ['products', productId, 'variants', filters ?? emptyObject] as const,
    detail: (productId: string, variantId: string) =>
      ['products', productId, 'variants', variantId] as const,
  },
};

export const imageKeys = {
  uploadUrl: (productId: string) => ['products', productId, 'images', 'upload'] as const,
};

export const variantKeys = {
  create: (productId: string) => ['products', productId, 'variants', 'create'] as const,
};

export const queryKeys = {
  auth: authKeys,
  products: productKeys,
  images: imageKeys,
  variants: variantKeys,
};

export type QueryKey =
  | ReturnType<typeof authKeys.profile>
  | ReturnType<typeof productKeys.list>
  | ReturnType<typeof productKeys.detail>
  | ReturnType<typeof productKeys.images.all>
  | ReturnType<typeof productKeys.images.list>
  | ReturnType<typeof productKeys.images.detail>
  | ReturnType<typeof productKeys.variants.all>
  | ReturnType<typeof productKeys.variants.list>
  | ReturnType<typeof productKeys.variants.detail>
  | ReturnType<typeof imageKeys.uploadUrl>
  | ReturnType<typeof variantKeys.create>;
