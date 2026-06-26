import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Constants } from 'expo-constants';

const getApiUrl = (): string => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (process.env.STAGING_API_URL) {
    return process.env.STAGING_API_URL;
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

  async getFigures() {
    const response = await this.api.get('/figures');
    return response.data.data;
  }

  async createFigure(data: { name: string; sku: string; description?: string }) {
    const response = await this.api.post('/figures', data);
    return response.data.data;
  }

  async updateFigure(id: number, data: { name?: string; sku?: string; description?: string }) {
    const response = await this.api.put(`/figures/${id}`, data);
    return response.data.data;
  }

  async deleteFigure(id: number) {
    await this.api.delete(`/figures/${id}`);
  }

  async getProducts(params?: { category_id?: number; featured?: boolean; in_stock?: boolean }) {
    const response = await this.api.get('/products', { params });
    return response.data;
  }

  async getProduct(id: number) {
    const response = await this.api.get(`/products/${id}`);
    return response.data.data;
  }

  async createProduct(data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
    category_id?: number;
    figure_id?: number;
    description?: string;
    cost?: number;
    min_stock?: number;
    image?: string;
    images?: string[];
    is_active?: boolean;
    is_featured?: boolean;
  }) {
    const response = await this.api.post('/products', data);
    return response.data.data;
  }

  async updateProduct(id: number, data: Partial<{
    name: string;
    sku: string;
    price: number;
    stock: number;
    category_id: number;
    figure_id: number;
    description: string;
    cost: number;
    min_stock: number;
    image: string;
    images: string[];
    is_active: boolean;
    is_featured: boolean;
  }>) {
    const response = await this.api.put(`/products/${id}`, data);
    return response.data.data;
  }

  async updateStock(id: number, stock: number) {
    const response = await this.api.patch(`/products/${id}/stock`, { stock });
    return response.data.data;
  }

  async deleteProduct(id: number) {
    await this.api.delete(`/products/${id}`);
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

  async getPublicProducts() {
    const response = await this.api.get('/public/products');
    return response.data;
  }
}

export const api = new ApiService();
export { API_URL };
