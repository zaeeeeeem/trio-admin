import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000';

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
    const response = await this.api.post<ApiResponse<{ token: string; admin: any }>>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get<ApiResponse<any>>('/api/auth/profile');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.api.put<ApiResponse<any>>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async getAdmins(page = 1, limit = 10) {
    const response = await this.api.get<PaginatedResponse<any>>('/api/admins', {
      params: { page, limit },
    });
    return response.data;
  }

  async createAdmin(data: any) {
    const response = await this.api.post<ApiResponse<any>>('/api/admins', data);
    return response.data;
  }

  async updateAdmin(id: string, data: any) {
    const response = await this.api.put<ApiResponse<any>>(`/api/admins/${id}`, data);
    return response.data;
  }

  async deleteAdmin(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/admins/${id}`);
    return response.data;
  }

  async getCategories(parentId?: string | null) {
    const params = parentId !== undefined ? { parentId: parentId === null ? 'null' : parentId } : {};
    const response = await this.api.get<ApiResponse<any[]>>('/api/categories', { params });
    return response.data;
  }

  async createCategory(data: any) {
    const response = await this.api.post<ApiResponse<any>>('/api/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: any) {
    const response = await this.api.put<ApiResponse<any>>(`/api/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/categories/${id}`);
    return response.data;
  }

  async getProducts(filters: any = {}) {
    const response = await this.api.get<PaginatedResponse<any>>('/api/products', {
      params: filters,
    });
    return response.data;
  }

  async getProduct(id: string) {
    const response = await this.api.get<ApiResponse<any>>(`/api/products/${id}`);
    return response.data;
  }

  async createProduct(data: any) {
    const response = await this.api.post<ApiResponse<any>>('/api/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: any) {
    const response = await this.api.put<ApiResponse<any>>(`/api/products/${id}`, data);
    return response.data;
  }

  async updateProductStock(id: string, quantity: number) {
    const response = await this.api.put<ApiResponse<any>>(`/api/products/${id}/stock`, { quantity });
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/products/${id}`);
    return response.data;
  }

  async getOrders(filters: any = {}) {
    const response = await this.api.get<PaginatedResponse<any>>('/api/orders', {
      params: filters,
    });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.api.get<ApiResponse<any>>(`/api/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: string, paymentStatus?: string, deliveryStatus?: string) {
    const response = await this.api.put<ApiResponse<any>>(`/api/orders/${id}/status`, {
      paymentStatus,
      deliveryStatus,
    });
    return response.data;
  }

  async deleteOrder(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/orders/${id}`);
    return response.data;
  }

  async getReviews(productId?: string) {
    const url = productId ? `/api/reviews/product/${productId}` : '/api/reviews';
    const response = await this.api.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async createReview(data: any) {
    const response = await this.api.post<ApiResponse<any>>('/api/reviews', data);
    return response.data;
  }

  async updateReview(id: string, data: any) {
    const response = await this.api.put<ApiResponse<any>>(`/api/reviews/${id}`, data);
    return response.data;
  }

  async deleteReview(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/reviews/${id}`);
    return response.data;
  }

  async getSubscriptionPlans(frequency?: string) {
    const params = frequency ? { frequency } : {};
    const response = await this.api.get<ApiResponse<any[]>>('/api/subscriptions/plans', { params });
    return response.data;
  }

  async createSubscriptionPlan(data: any) {
    const response = await this.api.post<ApiResponse<any>>('/api/subscriptions/plans', data);
    return response.data;
  }

  async updateSubscriptionPlan(id: string, data: any) {
    const response = await this.api.put<ApiResponse<any>>(`/api/subscriptions/plans/${id}`, data);
    return response.data;
  }

  async deleteSubscriptionPlan(id: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/subscriptions/plans/${id}`);
    return response.data;
  }

  async getSubscriptions(filters: any = {}) {
    const response = await this.api.get<PaginatedResponse<any>>('/api/subscriptions', {
      params: filters,
    });
    return response.data;
  }

  async getSubscription(id: string) {
    const response = await this.api.get<ApiResponse<any>>(`/api/subscriptions/${id}`);
    return response.data;
  }

  async cancelSubscription(id: string) {
    const response = await this.api.put<ApiResponse<any>>(`/api/subscriptions/${id}/cancel`);
    return response.data;
  }

  async getDashboardStats() {
    const response = await this.api.get<ApiResponse<any>>('/api/analytics/dashboard');
    return response.data;
  }

  async getBestSellers(limit = 10) {
    const response = await this.api.get<ApiResponse<any[]>>('/api/analytics/best-sellers', {
      params: { limit },
    });
    return response.data;
  }

  async getRevenueStats(period = 'monthly') {
    const response = await this.api.get<ApiResponse<any>>('/api/analytics/revenue', {
      params: { period },
    });
    return response.data;
  }

  async getProductStats() {
    const response = await this.api.get<ApiResponse<any>>('/api/analytics/products');
    return response.data;
  }

  async getTopRated(limit = 10) {
    const response = await this.api.get<ApiResponse<any[]>>('/api/analytics/top-rated', {
      params: { limit },
    });
    return response.data;
  }

  async getProductImages(productId: string) {
    const response = await this.api.get<ApiResponse<any[]>>(`/api/products/${productId}/images`);
    return response.data;
  }

  async getProductImage(productId: string, imageId: string) {
    const response = await this.api.get<ApiResponse<any>>(`/api/products/${productId}/images/${imageId}`);
    return response.data;
  }

  async createProductImage(productId: string, data: { imageUrl: string; isPrimary: boolean }) {
    const response = await this.api.post<ApiResponse<any>>(`/api/products/${productId}/images`, data);
    return response.data;
  }

  async updateProductImage(productId: string, imageId: string, data: { imageUrl?: string; isPrimary?: boolean }) {
    const response = await this.api.put<ApiResponse<any>>(`/api/products/${productId}/images/${imageId}`, data);
    return response.data;
  }

  async setProductImagePrimary(productId: string, imageId: string) {
    const response = await this.api.put<ApiResponse<any>>(`/api/products/${productId}/images/${imageId}/primary`);
    return response.data;
  }

  async deleteProductImage(productId: string, imageId: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/products/${productId}/images/${imageId}`);
    return response.data;
  }

  async getProductVariants(productId: string) {
    const response = await this.api.get<ApiResponse<any[]>>(`/api/products/${productId}/variants`);
    return response.data;
  }

  async getProductVariant(productId: string, variantId: string) {
    const response = await this.api.get<ApiResponse<any>>(`/api/products/${productId}/variants/${variantId}`);
    return response.data;
  }

  async createProductVariant(productId: string, data: { attributeName: string; attributeValue: string }) {
    const response = await this.api.post<ApiResponse<any>>(`/api/products/${productId}/variants`, data);
    return response.data;
  }

  async updateProductVariant(productId: string, variantId: string, data: { attributeName?: string; attributeValue?: string }) {
    const response = await this.api.put<ApiResponse<any>>(`/api/products/${productId}/variants/${variantId}`, data);
    return response.data;
  }

  async deleteProductVariant(productId: string, variantId: string) {
    const response = await this.api.delete<ApiResponse<any>>(`/api/products/${productId}/variants/${variantId}`);
    return response.data;
  }

  async bulkCreateProductVariants(productId: string, data: { variants: { attributeName: string; attributeValue: string }[] }) {
    const response = await this.api.post<ApiResponse<any[]>>(`/api/products/${productId}/variants/bulk`, data);
    return response.data;
  }
}

export const api = new ApiService();
