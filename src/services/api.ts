import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  Admin,
  ApiResponse,
  Category,
  DashboardStats,
  Order,
  OrderItem,
  PagePagination,
  Product,
  ProductImage,
  ProductVariant,
  VariantListFilters,
  CursorPagination,
  CreateVariantPayload,
  UpdateVariantPayload,
  ImageListParams,
  UploadProductImagePayload,
  UpdateProductImagePayload,
  DeleteProductImageParams,
  Review,
  ReviewInput,
  ReviewListResponse,
  Subscription,
  SubscriptionPlan,
  CreateOrderPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const isOrderLike = (value: unknown): value is Order & { _id?: string } => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return 'customerEmail' in value && 'paymentStatus' in value && 'deliveryStatus' in value;
};

const normalizeProductImage = (image: Partial<ProductImage>): ProductImage => {
  const rawPublicUrl =
    image.publicUrl ??
    (image as { secureUrl?: string }).secureUrl ??
    image.imageUrl ??
    (image as { url?: string }).url;
  const viewUrl = (image as { viewUrl?: string }).viewUrl;

  return {
    _id: image._id ?? (image as { id?: string }).id ?? '',
    productId: image.productId ?? '',
    publicUrl: rawPublicUrl ?? undefined,
    viewUrl: viewUrl ?? undefined,
    imageUrl: image.imageUrl ?? rawPublicUrl ?? viewUrl ?? undefined,
    isPrimary: Boolean(image.isPrimary),
    alt: image.alt,
    sortOrder: image.sortOrder,
    cloudinaryPublicId: (image as { cloudinaryPublicId?: string }).cloudinaryPublicId,
    storageKey: (image as { storageKey?: string }).storageKey,
    etag: (image as { etag?: string }).etag,
    bytes: (image as { bytes?: number }).bytes,
    width: (image as { width?: number }).width,
    height: (image as { height?: number }).height,
    format: (image as { format?: string }).format,
    createdAt: image.createdAt ?? new Date().toISOString(),
    updatedAt: image.updatedAt ?? image.createdAt ?? new Date().toISOString(),
  };
};

const normalizeProduct = (product: Partial<Product>): Product => {
  const id = product.id ?? (product as { _id?: string })._id ?? '';
  return {
    ...product,
    id,
    _id: (product as { _id?: string })._id,
    images: (product.images ?? []).map(normalizeProductImage),
    variants: (product.variants ?? []) as Product['variants'],
    legacyVariantAttributes: product.legacyVariantAttributes ?? [],
    createdAt: (product as { createdAt?: string }).createdAt ?? new Date().toISOString(),
    updatedAt:
      (product as { updatedAt?: string }).updatedAt ??
      (product as { createdAt?: string }).createdAt ??
      new Date().toISOString(),
  } as Product;
};

const normalizeOrderItem = (item: Partial<OrderItem>): OrderItem => {
  const rawProduct =
    (item as { product?: Product }).product ??
    (item as { product_id?: Product | string | null }).product_id ??
    (typeof item.productId === 'object' && item.productId !== null ? item.productId : undefined);

  const productInfo =
    rawProduct && typeof rawProduct === 'object'
      ? normalizeProduct(rawProduct as Partial<Product>)
      : undefined;

  const rawProductIdCandidate =
    (item as { productId?: string | { _id?: string; id?: string } }).productId ??
    (item as { product_id?: string | { _id?: string; id?: string } }).product_id;

  const rawProductId = rawProductIdCandidate as unknown;
  const productId =
    typeof rawProductId === 'string'
      ? rawProductId
      : productInfo?.id ??
        (typeof rawProductId === 'object' && rawProductId !== null
          ? (rawProductId as { _id?: string; id?: string })._id ??
            (rawProductId as { id?: string }).id ??
            ''
          : '');

  const price =
    typeof item.price === 'number'
      ? item.price
      : (item as { priceAtTime?: number }).priceAtTime ??
        (item as { price_at_time?: number }).price_at_time ??
        0;

  const subtotal =
    typeof item.subtotal === 'number'
      ? item.subtotal
      : (item as { subtotal?: number }).subtotal ?? price * (item.quantity ?? 0);

  return {
    productId,
    quantity: item.quantity ?? 0,
    price,
    subtotal,
    product: productInfo,
    productName:
      item.productName ??
      (item as { product_name?: string }).product_name ??
      productInfo?.name,
  };
};

const normalizeOrderData = (order: Partial<Order>): Order => {
  const itemsPayload =
    order.items ??
    (order as { order_items?: Partial<OrderItem>[] }).order_items ??
    (order as { items?: Partial<OrderItem>[] }).items ??
    [];

  const normalizedItems = itemsPayload.map(normalizeOrderItem);
  return {
    id:
      order.id ??
      (order as { _id?: string })._id ??
      (order as { id?: string }).id ??
      '',
    _id: (order as { _id?: string })._id,
    sessionId:
      order.sessionId ?? (order as { session_id?: string }).session_id ?? '',
    customerEmail:
      order.customerEmail ??
      (order as { customer_email?: string }).customer_email ??
      '',
    customerPhone:
      order.customerPhone ?? (order as { customer_phone?: string }).customer_phone,
    shippingAddress:
      order.shippingAddress ??
      (order as { shipping_address?: string }).shipping_address ??
      '',
    items: normalizedItems,
    totalAmount:
      typeof order.totalAmount === 'number'
        ? order.totalAmount
        : (order as { total_amount?: number }).total_amount ??
          normalizedItems.reduce(
            (sum, item) =>
              sum + (item.subtotal ?? item.price * item.quantity),
            0
          ),
    paymentStatus:
      order.paymentStatus ??
      (order as { payment_status?: Order['paymentStatus'] }).payment_status ??
      'pending',
    deliveryStatus:
      order.deliveryStatus ??
      (order as { delivery_status?: Order['deliveryStatus'] }).delivery_status ??
      'processing',
    paymentDetails:
      order.paymentDetails ??
      (order as { payment_details?: unknown }).payment_details,
    createdAt:
      order.createdAt ??
      (order as { createdAt?: string }).createdAt ??
      (order as { created_at?: string }).created_at ??
      new Date().toISOString(),
    updatedAt:
      order.updatedAt ??
      (order as { updatedAt?: string }).updatedAt ??
      (order as { updated_at?: string }).updated_at ??
      order.createdAt ??
      (order as { created_at?: string }).created_at ??
      new Date().toISOString(),
  };
};

const normalizeReview = (review: Partial<Review> & { isApproved?: boolean; _id?: string }): Review => {
  const rawProduct =
    (review as { product?: Partial<Product> }).product ??
    (typeof review.productId === 'object' && review.productId !== null
      ? (review.productId as unknown as Partial<Product>)
      : undefined);

  const product = rawProduct ? normalizeProduct(rawProduct) : undefined;

  return {
    id: review.id ?? review._id ?? '',
    _id: review._id,
    productId:
      typeof review.productId === 'string'
        ? review.productId
        : product?.id ?? '',
    rating: review.rating ?? 0,
    comment: review.comment,
    imageUrl: review.imageUrl,
    approved: review.approved ?? review.isApproved ?? false,
    createdAt: review.createdAt ?? new Date().toISOString(),
    updatedAt: review.updatedAt ?? review.createdAt ?? new Date().toISOString(),
    product,
  };
};

const buildCursorPagination = (data: unknown, fallbackLimit: number): CursorPagination => {
  const base = (data as { pagination?: CursorPagination; limit?: number; nextCursor?: string | null }) ?? {};
  const pagination = base.pagination;

  const limitValue =
    typeof pagination?.limit === 'number'
      ? pagination.limit
      : typeof base.limit === 'number'
      ? base.limit
      : fallbackLimit;

  const nextCursorValue =
    typeof pagination?.nextCursor === 'string'
      ? pagination.nextCursor
      : pagination?.nextCursor === null
      ? null
      : typeof base.nextCursor === 'string'
      ? base.nextCursor
      : base.nextCursor === null
      ? null
      : null;

  return {
    limit: limitValue,
    nextCursor: nextCursorValue,
  };
};

const buildReviewListResponse = (data: unknown, fallbackLimit: number): ReviewListResponse => {
  const base = (data ?? {}) as {
    items?: Array<Partial<Review>>;
    reviews?: Array<Partial<Review>>;
    pagination?: CursorPagination;
  };

  const rawItems = Array.isArray(base.items)
    ? base.items
    : Array.isArray(base.reviews)
    ? base.reviews
    : Array.isArray(data)
    ? (data as Array<Partial<Review>>)
    : [];

  const reviews = rawItems.map((item) => normalizeReview(item));
  const pagination = buildCursorPagination(base, fallbackLimit);

  return {
    reviews,
    pagination,
  };
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<any>>) => {
        if (error.response?.status === 401) {
          sessionStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    const response = await this.api.post<ApiResponse<{ token: string; admin: Admin & { _id?: string } }>>('/api/auth/login', {
      email,
      password,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const admin = payload.data?.admin
      ? {
          ...payload.data.admin,
          id: payload.data.admin.id ?? payload.data.admin._id ?? '',
        }
      : undefined;

    return {
      ...payload,
      data: payload.data
        ? {
            ...payload.data,
            admin,
          }
        : undefined,
    };
  }

  async getProfile() {
    const response = await this.api.get<ApiResponse<Admin | null>>('/api/auth/profile');
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const admin = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? '',
        }
      : null;

    return {
      ...payload,
      data: admin,
    };
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.api.put<ApiResponse<null>>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async getAdmins(page = 1, limit = 10) {
    const response = await this.api.get<ApiResponse<{ admins?: Admin[]; pagination?: PagePagination }>>('/api/admins', {
      params: { page, limit },
    });
    const payload = response.data;
    if (!payload.success) {
      return payload;
    }

    const admins =
      payload.data?.admins?.map((admin) => ({
        ...admin,
        id: admin.id ?? admin._id ?? '',
      })) ?? [];
    const pagination = payload.data?.pagination ?? {
      page,
      limit,
      totalPages: 1,
      total: admins.length,
    };

    return {
      ...payload,
      data: {
        admins,
        pagination,
      },
    };
  }

  async createAdmin(data: any) {
    const response = await this.api.post<ApiResponse<Admin & { _id?: string }>>('/api/admins', data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const admin = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? '',
        }
      : undefined;

    return {
      ...payload,
      data: admin,
    };
  }

  async updateAdmin(id: string, data: any) {
    const response = await this.api.put<ApiResponse<Admin & { _id?: string }>>(`/api/admins/${id}`, data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const admin = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: admin,
    };
  }

  async deleteAdmin(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/admins/${id}`);
    return response.data;
  }

  async getCategories(parentId?: string | null) {
    const params = parentId !== undefined ? { parentId: parentId === null ? 'null' : parentId } : {};
    const response = await this.api.get<ApiResponse<Category[]>>('/api/categories', { params });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const categories =
      payload.data?.map((category) => ({
        ...category,
        id: category.id ?? category._id ?? '',
      })) ?? [];

    return {
      ...payload,
      data: categories,
    };
  }

  async createCategory(data: any) {
    const response = await this.api.post<ApiResponse<Category & { _id?: string }>>('/api/categories', data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const category = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? '',
        }
      : undefined;

    return {
      ...payload,
      data: category,
    };
  }

  async updateCategory(id: string, data: any) {
    const response = await this.api.put<ApiResponse<Category & { _id?: string }>>(`/api/categories/${id}`, data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const category = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: category,
    };
  }

  async deleteCategory(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/categories/${id}`);
    return response.data;
  }

  async getProducts(filters: Record<string, unknown> = {}) {
    const response = await this.api.get<
      ApiResponse<{
        products?: Product[];
        items?: Product[];
        pagination?: PagePagination;
      }>
    >('/api/products', {
      params: filters,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const data = (payload.data ?? {}) as {
      products?: Product[];
      items?: Product[];
      pagination?: PagePagination;
    };
    const rawProducts = data.products ?? data.items ?? [];
    const products = rawProducts.map((product) => normalizeProduct(product));
    const pageParam = filters['page'] as number | string | undefined;
    const limitParam = filters['limit'] as number | string | undefined;
    const pageNumber = typeof pageParam === 'number' ? pageParam : Number(pageParam ?? 1);
    const limitNumber = typeof limitParam === 'number' ? limitParam : Number(limitParam ?? 10);

    const pagination =
      data.pagination ?? {
        page: Number.isNaN(pageNumber) ? 1 : pageNumber,
        limit: Number.isNaN(limitNumber) ? 10 : limitNumber,
        totalPages: 1,
        total: products.length,
      };

    return {
      ...payload,
      data: {
        products,
        pagination,
      },
    };
  }

  async getProduct(id: string) {
    const response = await this.api.get<ApiResponse<Product & { _id?: string }>>(`/api/products/${id}`);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const productData = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: productData,
    };
  }

  async createProduct(data: any) {
    const response = await this.api.post<ApiResponse<Product & { _id?: string }>>('/api/products', data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const productData = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? '',
        }
      : undefined;

    return {
      ...payload,
      data: productData,
    };
  }

  async updateProduct(id: string, data: any) {
    const response = await this.api.put<ApiResponse<Product & { _id?: string }>>(`/api/products/${id}`, data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const productData = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: productData,
    };
  }

  async updateProductStock(id: string, quantity: number) {
    const response = await this.api.put<ApiResponse<Product & { _id?: string }>>(`/api/products/${id}/stock`, { quantity });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const productData = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: productData,
    };
  }

  async deleteProduct(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/products/${id}`);
    return response.data;
  }

  async getOrders(filters: Record<string, unknown> = {}) {
    const response = await this.api.get<
      ApiResponse<{
        orders?: Order[];
        pagination?: PagePagination;
      }>
    >('/api/orders', {
      params: filters,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const orders = payload.data?.orders?.map((order) => normalizeOrderData(order)) ?? [];
    const pageParam = filters['page'] as number | string | undefined;
    const limitParam = filters['limit'] as number | string | undefined;
    const pageNumber = typeof pageParam === 'number' ? pageParam : Number(pageParam ?? 1);
    const limitNumber = typeof limitParam === 'number' ? limitParam : Number(limitParam ?? 10);

    const pagination =
      payload.data?.pagination ?? {
        page: Number.isNaN(pageNumber) ? 1 : pageNumber,
        limit: Number.isNaN(limitNumber) ? 10 : limitNumber,
        totalPages: 1,
        total: orders.length,
      };

    return {
      ...payload,
      data: {
        orders,
        pagination,
      },
    };
  }

  async getOrder(id: string) {
    const response = await this.api.get<ApiResponse<Order & { _id?: string }>>(`/api/orders/${id}`);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const orderData = payload.data ? normalizeOrderData(payload.data) : undefined;

    return {
      ...payload,
      data: orderData,
    };
  }

  async updateOrderStatus(id: string, paymentStatus?: string, deliveryStatus?: string) {
    const response = await this.api.put<ApiResponse<Order & { _id?: string }>>(`/api/orders/${id}/status`, {
      paymentStatus,
      deliveryStatus,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const orderData = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: orderData,
    };
  }

  async deleteOrder(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/orders/${id}`);
    return response.data;
  }

  async createSession() {
    const response = await this.api.post<ApiResponse<{ sessionId: string }>>('/api/sessions');
    return response.data;
  }

  async createOrder(data: CreateOrderPayload): Promise<ApiResponse<Order>> {
    const response = await this.api.post<ApiResponse<Order & { _id?: string }>>('/api/orders', data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const rawData = payload.data as unknown;

    const orderPayload =
      (isOrderLike(rawData) && rawData) ||
      (typeof rawData === 'object' && rawData !== null && 'order' in rawData && isOrderLike((rawData as { order?: unknown }).order)
        ? ((rawData as { order?: Order }).order as Order & { _id?: string })
        : undefined);

    const itemsPayload =
      typeof rawData === 'object' && rawData !== null && 'items' in rawData && Array.isArray((rawData as { items?: unknown }).items)
        ? ((rawData as { items?: Order['items'] }).items as Order['items'])
        : orderPayload?.items;

    const mergedOrder = orderPayload
      ? normalizeOrderData({
          ...orderPayload,
          items: itemsPayload ?? orderPayload.items,
        })
      : undefined;

    return {
      ...payload,
      data: mergedOrder,
    } as ApiResponse<Order>;
  }

  async getLatestReviews(params: { limit?: number; cursor?: string | null; approved?: boolean } = {}) {
    const { limit = 10, cursor, approved } = params;
    const query: Record<string, unknown> = { limit };

    if (cursor) {
      query.cursor = cursor;
    }

    if (typeof approved === 'boolean') {
      query.approved = approved;
    }

    const response = await this.api.get<ApiResponse<{ items?: Review[]; reviews?: Review[]; pagination?: CursorPagination }>>(
      '/api/reviews',
      { params: query }
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const list = buildReviewListResponse(payload.data, limit);

    return {
      ...payload,
      data: list,
    } satisfies ApiResponse<ReviewListResponse>;
  }

  async getReviewsByProduct(
    productId: string,
    params: { limit?: number; cursor?: string | null; approved?: boolean } = {}
  ) {
    const { limit = 10, cursor, approved } = params;
    const query: Record<string, unknown> = { limit };

    if (cursor) {
      query.cursor = cursor;
    }

    if (typeof approved === 'boolean') {
      query.approved = approved;
    }

    const response = await this.api.get<
      ApiResponse<{ items?: Review[]; reviews?: Review[]; pagination?: CursorPagination }>
    >(`/api/reviews/product/${productId}`, { params: query });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const list = buildReviewListResponse(payload.data, limit);

    return {
      ...payload,
      data: list,
    } satisfies ApiResponse<ReviewListResponse>;
  }

  async createReview(data: ReviewInput) {
    const response = await this.api.post<ApiResponse<Review>>('/api/reviews', {
      ...data,
      isApproved: data.approved,
    });
    const payload = response.data;
    if (!payload.success) {
      return payload;
    }

    return {
      ...payload,
      data: payload.data ? normalizeReview(payload.data) : undefined,
    };
  }

  async updateReview(id: string, data: Partial<ReviewInput>) {
    const response = await this.api.put<ApiResponse<Review>>(`/api/reviews/${id}`, {
      ...data,
      isApproved: data.approved,
    });
    const payload = response.data;
    if (!payload.success) {
      return payload;
    }

    return {
      ...payload,
      data: payload.data ? normalizeReview(payload.data) : undefined,
    };
  }

  async toggleReviewApproval(id: string, approved: boolean) {
    return this.updateReview(id, { approved });
  }

  async deleteReview(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/reviews/${id}`);
    return response.data;
  }

  async getSubscriptionPlans(frequency?: string) {
    const params = frequency ? { frequency } : {};
    const response = await this.api.get<ApiResponse<Array<SubscriptionPlan & { _id?: string }>>>('/api/subscriptions/plans', { params });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const plans =
      payload.data?.map((plan) => ({
        ...plan,
        id: plan.id ?? plan._id ?? '',
      })) ?? [];

    return {
      ...payload,
      data: plans,
    };
  }

  async createSubscriptionPlan(data: any) {
    const response = await this.api.post<ApiResponse<SubscriptionPlan & { _id?: string }>>('/api/subscriptions/plans', data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const plan = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? '',
        }
      : undefined;

    return {
      ...payload,
      data: plan,
    };
  }

  async updateSubscriptionPlan(id: string, data: any) {
    const response = await this.api.put<ApiResponse<SubscriptionPlan & { _id?: string }>>(`/api/subscriptions/plans/${id}`, data);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const plan = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: plan,
    };
  }

  async deleteSubscriptionPlan(id: string) {
    const response = await this.api.delete<ApiResponse<null>>(`/api/subscriptions/plans/${id}`);
    return response.data;
  }

  async getSubscriptions(filters: Record<string, unknown> = {}) {
    const response = await this.api.get<
      ApiResponse<{
        subscriptions?: Subscription[];
        pagination?: PagePagination;
      }>
    >('/api/subscriptions', {
      params: filters,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const subscriptions =
      payload.data?.subscriptions?.map((subscription) => ({
        ...subscription,
        id: subscription.id ?? subscription._id ?? '',
      })) ?? [];
    const pageParam = filters['page'] as number | string | undefined;
    const limitParam = filters['limit'] as number | string | undefined;
    const pageNumber = typeof pageParam === 'number' ? pageParam : Number(pageParam ?? 1);
    const limitNumber = typeof limitParam === 'number' ? limitParam : Number(limitParam ?? 10);

    const pagination =
      payload.data?.pagination ?? {
        page: Number.isNaN(pageNumber) ? 1 : pageNumber,
        limit: Number.isNaN(limitNumber) ? 10 : limitNumber,
        totalPages: 1,
        total: subscriptions.length,
      };

    return {
      ...payload,
      data: {
        subscriptions,
        pagination,
      },
    };
  }

  async getSubscription(id: string) {
    const response = await this.api.get<ApiResponse<Subscription & { _id?: string }>>(`/api/subscriptions/${id}`);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const subscription = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: subscription,
    };
  }

  async cancelSubscription(id: string) {
    const response = await this.api.put<ApiResponse<Subscription & { _id?: string }>>(`/api/subscriptions/${id}/cancel`);
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const subscription = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? id,
        }
      : undefined;

    return {
      ...payload,
      data: subscription,
    };
  }

  async getDashboardStats() {
    const response = await this.api.get<ApiResponse<DashboardStats>>('/api/analytics/dashboard');
    return response.data;
  }

  async getBestSellers(limit = 10) {
    const response = await this.api.get<
      ApiResponse<
        Array<{
          productId: string;
          productName: string;
          totalSold: number;
          revenue: number;
          category: string;
          averageRating?: number;
        }>
      >
    >('/api/analytics/best-sellers', {
      params: { limit },
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const sellers =
      payload.data?.map((item) => ({
        ...item,
        name: item.productName,
        id: item.productId,
      })) ?? [];

    return {
      ...payload,
      data: sellers,
    };
  }

  async getRevenueStats(period = 'monthly') {
    const response = await this.api.get<
      ApiResponse<{
        period: string;
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        breakdown: Array<{
          date: string;
          revenue: number;
          orders: number;
          averageOrderValue?: number;
        }>;
      }>
    >('/api/analytics/revenue', {
      params: { period },
    });
    return response.data;
  }

  async getProductStats() {
    const response = await this.api.get<
      ApiResponse<{
        totalProducts: number;
        activeProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        productsByType: Record<string, number>;
      }>
    >('/api/analytics/products');
    return response.data;
  }

  async getTopRated(limit = 10) {
    const response = await this.api.get<
      ApiResponse<
        Array<{
          productId: string;
          productName: string;
          averageRating: number;
          reviewCount: number;
          category: string;
        }>
      >
    >('/api/analytics/top-rated', {
      params: { limit },
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const products =
      payload.data?.map((item) => ({
        ...item,
        id: item.productId,
        name: item.productName,
      })) ?? [];

    return {
      ...payload,
      data: products,
    };
  }

  async getProductImages(productId: string, params: ImageListParams = {}) {
    const response = await this.api.get<
      ApiResponse<{
        items?: ProductImage[];
        pagination?: CursorPagination;
      }>
    >(`/api/products/${productId}/images`, { params });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const items = payload.data?.items?.map((image) => normalizeProductImage(image)) ?? [];

    return {
      ...payload,
      data: {
        items,
        pagination:
          payload.data?.pagination ?? {
            limit: params.limit ?? 20,
            nextCursor: null,
          },
      },
    };
  }

  async getProductImage(productId: string, imageId: string) {
    const response = await this.api.get<ApiResponse<ProductImage>>(
      `/api/products/${productId}/images/${imageId}`
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const image = payload.data ? normalizeProductImage(payload.data) : undefined;

    return {
      ...payload,
      data: image,
    };
  }

  async createProductImage(
    productId: string,
    data: UploadProductImagePayload
  ): Promise<ApiResponse<ProductImage[]>> {
    const formData = new FormData();
    const files = data.files && data.files.length > 0 ? data.files : data.file ? [data.file] : [];

    if (files.length === 0) {
      throw new Error('No files provided for upload');
    }

    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => formData.append('files', file));
    } else if (data.file) {
      formData.append('file', data.file);
    }

    if (typeof data.isPrimary === 'boolean') {
      formData.append('isPrimary', String(data.isPrimary));
    }
    if (typeof data.primaryIndex === 'number') {
      formData.append('primaryIndex', String(data.primaryIndex));
    }
    if (data.alt) {
      formData.append('alt', data.alt);
    }
    if (typeof data.sortOrder === 'number') {
      formData.append('sort_order', String(data.sortOrder));
    }

    const response = await this.api.post<ApiResponse<ProductImage | ProductImage[]>>(
      `/api/products/${productId}/images/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    const payload = response.data;

    if (!payload.success) {
      return {
        ...payload,
        data: undefined,
      };
    }

    const rawData = payload.data;
    const items = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
    const images = items.map((image) => normalizeProductImage(image));

    return {
      ...payload,
      data: images,
    };
  }

  async updateProductImage(productId: string, imageId: string, data: UpdateProductImagePayload) {
    const response = await this.api.patch<ApiResponse<ProductImage>>(
      `/api/products/${productId}/images/${imageId}`,
      {
        ...(data.alt !== undefined ? { alt: data.alt } : {}),
        ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
        ...(data.sortOrder !== undefined ? { sort_order: data.sortOrder } : {}),
      }
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const image = payload.data ? normalizeProductImage(payload.data) : undefined;

    return {
      ...payload,
      data: image,
    };
  }

  async setProductImagePrimary(productId: string, imageId: string) {
    return this.updateProductImage(productId, imageId, { isPrimary: true });
  }

  async deleteProductImage(productId: string, imageId: string, params: DeleteProductImageParams = {}) {
    const response = await this.api.delete<ApiResponse<null>>(
      `/api/products/${productId}/images/${imageId}`,
      {
        params: {
          ...(params.deleteFile ? { deleteFile: params.deleteFile } : {}),
        },
      }
    );
    return response.data;
  }

  async getProductVariants(productId: string, filters: VariantListFilters = {}) {
    const response = await this.api.get<
      ApiResponse<{
        items?: Array<ProductVariant & { id?: string }>;
        pagination?: CursorPagination;
      }>
    >(`/api/products/${productId}/variants`, {
      params: filters,
    });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const variants =
      payload.data?.items?.map((variant) => ({
        ...variant,
        id: variant.id ?? variant._id,
      })) ?? [];

    return {
      ...payload,
      data: {
        items: variants,
        pagination: payload.data?.pagination ?? {
          limit: filters.limit ?? 20,
          nextCursor: null,
        },
      },
    };
  }

  async getProductVariant(productId: string, variantId: string) {
    const response = await this.api.get<ApiResponse<ProductVariant & { id?: string }>>(
      `/api/products/${productId}/variants/${variantId}`
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const variant = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id,
        }
      : undefined;

    return {
      ...payload,
      data: variant,
    };
  }

  async createProductVariant(productId: string, data: CreateVariantPayload) {
    const response = await this.api.post<ApiResponse<ProductVariant & { id?: string }>>(
      `/api/products/${productId}/variants`,
      data
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const variant = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id,
        }
      : undefined;

    return {
      ...payload,
      data: variant,
    };
  }

  async updateProductVariant(productId: string, variantId: string, data: UpdateVariantPayload) {
    const response = await this.api.patch<ApiResponse<ProductVariant & { id?: string }>>(
      `/api/products/${productId}/variants/${variantId}`,
      data
    );
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const variant = payload.data
      ? {
          ...payload.data,
          id: payload.data.id ?? payload.data._id ?? variantId,
        }
      : undefined;

    return {
      ...payload,
      data: variant,
    };
  }

  async deleteProductVariant(productId: string, variantId: string) {
    const response = await this.api.delete<ApiResponse<null>>(
      `/api/products/${productId}/variants/${variantId}`
    );
    return response.data;
  }

  async bulkCreateProductVariants(productId: string, variants: CreateVariantPayload[]) {
    const response = await this.api.post<
      ApiResponse<{
        items: Array<ProductVariant & { id?: string }>;
      }>
    >(`/api/products/${productId}/variants/bulk`, { variants });
    const payload = response.data;

    if (!payload.success) {
      return payload;
    }

    const items = payload.data?.items?.map((variant) => ({
      ...variant,
      id: variant.id ?? variant._id,
    })) ?? [];

    return {
      ...payload,
      data: {
        items,
      },
    };
  }
}

export const api = new ApiService();
