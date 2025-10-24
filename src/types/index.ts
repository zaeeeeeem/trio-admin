export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  isPrimary: boolean;
}

export interface ProductImageEntity {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVariant {
  name: string;
  value: string;
}

export interface ProductVariantAttribute {
  id: string;
  productId: string;
  attributeName: string;
  attributeValue: string;
}

export interface Product {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  quantity: number;
  rating: number;
  totalRatings: number;
  productType: 'coffee' | 'drink' | 'sandwich' | 'dessert' | 'flower' | 'book';
  keywords?: string;
  features?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  _id: string;
  sessionId: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryStatus: 'processing' | 'delivered' | 'cancelled';
  paymentDetails?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  frequency: 'weekly' | 'monthly' | 'custom';
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  planId: string;
  sessionId: string;
  customerEmail: string;
  customerPhone?: string;
  giftFor?: string;
  deliveryAddress: string;
  startDate: string;
  status: 'active' | 'cancelled' | 'expired';
  recoveryToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalSubscriptions: number;
  lowStockProducts: number;
  totalRevenue: number;
  pendingOrders: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
    };
  };
}
