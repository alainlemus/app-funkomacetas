export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  funkomacetas_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Figure {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sku: string;
  is_active: boolean;
  funkomacetas_count?: number;
}

export interface Funkomaceta {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  cost: string | null;
  stock: number;
  min_stock: number;
  sku: string;
  image: string | null;
  images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  sales_count: number;
  category_id: number | null;
  figure_id: number | null;
  category?: Category;
  figure?: Figure;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
