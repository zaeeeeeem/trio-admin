import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api';

const resolveBaseUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const payload = response.data;
    if (isApiResponse(payload)) {
      if (payload.success) {
        return payload.data;
      }

      const apiError = new AxiosError(
        payload.message ?? 'Request failed',
        String(response.status ?? 'ERR_API_RESPONSE'),
        response.config,
        response.request,
        response
      );
      (apiError as AxiosError & { payload?: ApiResponse<unknown> }).payload = payload;
      throw apiError;
    }

    return payload as unknown;
  },
  (error) => {
    if (error.response && isApiEnvelope(error.response.data)) {
      error.message = error.response.data.message ?? error.message;
    }
    return Promise.reject(error);
  }
);

export const withTokenHeaders = (
  token?: string,
  headers: Record<string, string> = {}
): Record<string, string> => {
  const resolvedToken = token ?? sessionStorage.getItem('token');
  if (!resolvedToken) {
    return headers;
  }
  return {
    ...headers,
    Authorization: `Bearer ${resolvedToken}`,
  };
};

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null || !('success' in value)) {
    return false;
  }
  return typeof (value as { success: unknown }).success === 'boolean';
}

export const apiClient = api;
