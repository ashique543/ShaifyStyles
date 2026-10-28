import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Admin, AdminLoginResponse, DashboardMetrics,
  AdminProduct, AdminOrder
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);

  private get baseUrl(): string {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:5000/api/admin'
      : '/api/admin';
  }

  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('shaify_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  login(username: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.baseUrl}/login`, { username, password });
  }

  getMe(): Observable<{ success: boolean; admin: Admin }> {
    return this.http.get<any>(`${this.baseUrl}/me`, { headers: this.getHeaders() });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getMetrics(): Observable<{ success: boolean; metrics: DashboardMetrics; recent_orders: AdminOrder[] }> {
    return this.http.get<any>(`${this.baseUrl}/metrics`, { headers: this.getHeaders() });
  }

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts(page = 1, perPage = 20, search = '', category = ''): Observable<any> {
    let params = `page=${page}&per_page=${perPage}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (category) params += `&category=${encodeURIComponent(category)}`;
    return this.http.get<any>(`${this.baseUrl}/products?${params}`, { headers: this.getHeaders() });
  }

  createProduct(data: Partial<AdminProduct>): Observable<{ success: boolean; product: AdminProduct; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/products`, data, { headers: this.getHeaders() });
  }

  updateProduct(id: number, data: Partial<AdminProduct>): Observable<{ success: boolean; product: AdminProduct; message: string }> {
    return this.http.put<any>(`${this.baseUrl}/products/${id}`, data, { headers: this.getHeaders() });
  }

  deleteProduct(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.baseUrl}/products/${id}`, { headers: this.getHeaders() });
  }

  uploadImage(file: File): Observable<{ success: boolean; url: string; storage: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/upload`, formData, { headers: this.getHeaders() });
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders(page = 1, perPage = 20, status = '', search = '', dateFrom = '', dateTo = ''): Observable<any> {
    let params = `page=${page}&per_page=${perPage}`;
    if (status) params += `&status=${encodeURIComponent(status)}`;
    if (search) params += `&search=${encodeURIComponent(search)}`;
    if (dateFrom) params += `&date_from=${dateFrom}`;
    if (dateTo) params += `&date_to=${dateTo}`;
    return this.http.get<any>(`${this.baseUrl}/orders?${params}`, { headers: this.getHeaders() });
  }

  getOrder(id: number): Observable<{ success: boolean; order: AdminOrder }> {
    return this.http.get<any>(`${this.baseUrl}/orders/${id}`, { headers: this.getHeaders() });
  }

  updateOrderStatus(
    id: number,
    payload: { status?: string; tracking_carrier?: string; tracking_number?: string; notes?: string }
  ): Observable<{ success: boolean; order: AdminOrder; message: string }> {
    return this.http.patch<any>(`${this.baseUrl}/orders/${id}/status`, payload, { headers: this.getHeaders() });
  }

  // ── Deployment & Integration Status ───────────────────────────────────────
  getDeploymentStatus(): Observable<{ success: boolean; status: any }> {
    return this.http.get<any>(`${this.baseUrl}/deployment-status`, { headers: this.getHeaders() });
  }
}

