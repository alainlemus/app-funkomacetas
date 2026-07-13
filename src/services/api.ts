import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://sistema-funkos.test/api';

console.log('[API] Base URL:', API_URL);
console.log('[API] Env var EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
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

  async toggleCategoryActive(id: number) {
    const response = await this.api.patch(`/categories/${id}/toggle-active`);
    return response.data.data;
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

  async toggleFigureActive(id: number) {
    const response = await this.api.patch(`/figures/${id}/toggle-active`);
    return response.data.data;
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
    const sanitized = {
      ...data,
      image: data.image ? this.toStoragePath(data.image) : undefined,
      images: data.images?.map((u) => this.toStoragePath(u)),
    };
    const response = await this.api.post('/products', sanitized);
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
    const sanitized: any = { ...data };
    if (data.image !== undefined) {
      sanitized.image = data.image ? this.toStoragePath(data.image) : null;
    }
    if (data.images !== undefined) {
      sanitized.images = data.images.map((u) => this.toStoragePath(u));
    }
    const response = await this.api.put(`/products/${id}`, sanitized);
    return response.data.data;
  }

  private toStoragePath(url: string): string {
    if (!url) return url;
    if (!url.startsWith('http')) return url;
    const match = url.match(/\/storage\/(.+)$/);
    return match ? match[1] : url;
  }

  async updateStock(id: number, stock: number) {
    const response = await this.api.patch(`/products/${id}/stock`, { stock });
    return response.data.data;
  }

  async deleteProduct(id: number) {
    await this.api.delete(`/products/${id}`);
  }

  async toggleProductActive(id: number) {
    const response = await this.api.patch(`/products/${id}/toggle-active`);
    return response.data.data;
  }

  async recordSale(id: number, quantity: number = 1) {
    const response = await this.api.post(`/products/${id}/sale`, { quantity });
    return response.data.data;
  }

  async getTopSelling(limit: number = 5) {
    const response = await this.api.get('/products/top-selling', { params: { limit } });
    return response.data.data;
  }

  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = this.normalizeFilename(uri);
    const type = this.getMimeType(uri);

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await this.api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data,
    });

    return response.data.url;
  }

  async uploadImages(uris: string[]): Promise<string[]> {
    const formData = new FormData();

    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      const filename = this.normalizeFilename(uri, i);
      const type = this.getMimeType(uri);

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
      transformRequest: (data) => data,
    });

    return response.data.urls;
  }

  private normalizeFilename(uri: string, index = 0): string {
    const raw = uri.split('/').pop() || `image_${Date.now()}_${index}`;
    const ext = raw.match(/\.(jpe?g|png|gif|webp|heic|heif)$/i)?.[1]?.toLowerCase();
    const finalExt = ext === 'jpeg' ? 'jpg' : ext || 'jpg';
    const base = raw.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${base}.${finalExt}`;
  }

  private getMimeType(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.heif')) return 'image/heif';
    return 'image/jpeg';
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
