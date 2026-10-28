export interface Product {
  id: number;
  title: string;
  description: string;
  category: 'Suits & Kurtis' | 'Hijab Bouquets' | 'Custom Hampers' | string;
  price: number;
  discounted_price: number | null;
  image_url: string;
  stock: number;
  sizes: string[];
  badge?: string;
  fabric?: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderPayload {
  items: {
    product_id: number;
    quantity: number;
    size: string;
  }[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string | ShippingAddress;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: number;
  razorpay_order_id: string;
  amount: number; // in paise
  currency: string;
  key_id: string;
  is_mock?: boolean;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  message?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id?: number;
}

export interface OrderDetail {
  id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: 'created' | 'paid' | 'failed' | 'delivered';
  notes?: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    product_title: string;
    product_image: string;
    quantity: number;
    size: string;
    price: number;
    subtotal: number;
  }[];
}
