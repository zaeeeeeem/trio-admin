export * from './api';

import type { CursorPagination, Product } from './api';

export interface Admin {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  productName?: string;
  subtotal?: number;
}

export interface Order {
  id: string;
  _id?: string;
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

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  sessionId?: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  items: CreateOrderItem[];
  paymentDetails?: {
    gateway: string;
    transactionRef: string;
  };
}

export interface Review {
  id: string;
  _id?: string;
  productId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface ReviewInput {
  productId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  approved?: boolean;
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: CursorPagination;
}

export interface SubscriptionPlan {
  id: string;
  _id?: string;
  name: string;
  frequency: 'weekly' | 'monthly' | 'custom';
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  _id?: string;
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
