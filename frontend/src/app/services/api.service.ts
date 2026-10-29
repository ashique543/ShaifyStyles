import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  CreateOrderPayload, 
  CreateOrderResponse, 
  VerifyPaymentPayload, 
  OrderDetail 
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // Default to localhost:5000 or relative /api if deployed behind reverse proxy
  private baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : '/api';

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getProducts(category?: string, search?: string, sort?: string): Observable<{ success: boolean; count: number; products: Product[] }> {
    let params = new HttpParams();
    if (category && category !== 'All') {
      params = params.set('category', category);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<{ success: boolean; count: number; products: Product[] }>(`${this.baseUrl}/products`, { params });
  }

  getProduct(id: number): Observable<{ success: boolean; product: Product }> {
    return this.http.get<{ success: boolean; product: Product }>(`${this.baseUrl}/products/${id}`);
  }

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders/create`, payload);
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<{ success: boolean; message: string; order: OrderDetail }> {
    return this.http.post<{ success: boolean; message: string; order: OrderDetail }>(`${this.baseUrl}/orders/verify`, payload);
  }

  getOrder(id: number): Observable<{ success: boolean; order: OrderDetail }> {
    return this.http.get<{ success: boolean; order: OrderDetail }>(`${this.baseUrl}/orders/${id}`);
  }

  getCategories(): Observable<{ success: boolean; categories: { id: number; name: string; slug: string; icon?: string; description?: string }[] }> {
    return this.http.get<any>(`${this.baseUrl}/categories`);
  }

  validateCoupon(code: string, orderAmount: number): Observable<{ success: boolean; coupon?: any; discount_amount?: number; message?: string }> {
    return this.http.post<any>(`${this.baseUrl}/coupons/validate`, { code, order_amount: orderAmount });
  }

  downloadInvoice(orderId: number): void {
    const url = `${this.baseUrl}/orders/${orderId}/invoice`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-SS-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  getHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/health`);
  }
}
