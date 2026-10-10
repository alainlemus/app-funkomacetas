import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { Figure, FigureStats, PaginatedResponse } from '../types';

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return 'http://sistema-funkos.test/api';
};

const API_URL = getApiUrl();

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('api_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          SecureStore.deleteItemAsync('api_token');
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.token) {
      await SecureStore.setItemAsync('api_token', response.data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync('api_token');
      await SecureStore.deleteItemAsync('user');
    }
  }

  async getUser() {
    const response = await this.api.get('/auth/me');
    return response.data.user;
  }

  async getCategories() {
    const response = await this.api.get('/categories');
    return response.data.data;
  }

  async createCategory(data: { name: string; description?: string; is_active?: boolean }) {
    const response = await this.api.post('/categories', data);
    return response.data.data;
  }

  async updateCategory(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    const response = await this.api.put(`/categories/${id}`, data);
    return response.data.data;
  }

  async deleteCategory(id: number) {
    await this.api.delete(`/categories/${id}`);
  }

  async getFigures(params?: {
    search?: string;
    category_id?: number;
    active?: boolean;
    no_price?: boolean;
    low_stock?: boolean;
    featured?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Figure>> {
    const response = await this.api.get('/figures', { params });
    return response.data;
  }

  async getFigureStats(): Promise<FigureStats> {
    const response = await this.api.get('/figures/stats');
    return response.data.data;
  }

  async getFigure(id: number): Promise<Figure> {
    const response = await this.api.get(`/figures/${id}`);
    return response.data.data;
  }

  async createFigure(data: FigureInput): Promise<Figure> {
    const response = await this.api.post('/figures', data);
    return response.data.data;
  }

  async updateFigure(id: number, data: Partial<FigureInput>): Promise<Figure> {
    const response = await this.api.put(`/figures/${id}`, data);
    return response.data.data;
  }

  async updateStock(id: number, stock: number): Promise<Figure> {
    const response = await this.api.patch(`/figures/${id}/stock`, { stock });
    return response.data.data;
  }

  async deleteFigure(id: number) {
    await this.api.delete(`/figures/${id}`);
  }

  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await this.api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }

  async uploadImages(uris: string[]): Promise<string[]> {
    const formData = new FormData();

    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      const filename = uri.split('/').pop() || `image_${i}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('images[]', {
        uri,
        name: filename,
        type,
      } as any);
    }

    const response = await this.api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.urls;
  }

  async getPublicCatalog() {
    const response = await this.api.get('/public/catalog');
    return response.data.data;
  }

  async getPublicFigures() {
    const response = await this.api.get('/public/figures');
    return response.data;
  }
}

export interface FigureInput {
  name: string;
  sku: string;
  price: number;
  stock: number;
  category_id?: number | null;
  description?: string;
  cost?: number;
  min_stock?: number;
  image?: string | null;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export const api = new ApiService();
export { API_URL };
