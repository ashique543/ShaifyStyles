export interface Admin {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AdminLoginResponse {
  success: boolean;
  access_token: string;
  admin: Admin;
  message?: string;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  orders_by_status: Record<string, number>;
  pending_dispatch: number;
  low_stock_count: number;
  low_stock_products: AdminProduct[];
}

export interface AdminProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discounted_price: number | null;
  image_url: string;
  stock: number;
  sizes: string[];
  badge?: string;
  fabric?: string;
  created_at?: string;
}

export interface AdminOrder {
  id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: 'created' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'cancelled';
  notes?: string;
  tracking_carrier?: string;
  tracking_number?: string;
  created_at: string;
  updated_at?: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: number;
  product_id: number;
  product_title: string;
  product_image: string;
  quantity: number;
  size: string;
  price: number;
  subtotal: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  pages: number;
  current_page: number;
  items?: T[];
}
