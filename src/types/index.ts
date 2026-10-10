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
  figures_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Figure {
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
  category_id: number | null;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface FigureStats {
  total: number;
  active: number;
  inactive: number;
  no_price: number;
  low_stock: number;
  out_of_stock: number;
  inventory_value: number;
  categories: number;
  low_stock_items: Figure[];
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
