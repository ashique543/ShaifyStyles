import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface CustomerUser {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  auth_provider: 'google' | 'phone';
  default_address?: string | null;
  created_at?: string;
  last_login?: string;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  user: CustomerUser;
  message: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  expires_in_seconds: number;
  is_simulation: boolean;
  demo_otp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerAuthService {
  private http = inject(HttpClient);
  private baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : '/api';

  private readonly TOKEN_KEY = 'shaify_customer_token';
  private readonly USER_KEY = 'shaify_customer_user';

  currentUser = signal<CustomerUser | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());
  isLoggedIn = computed(() => !!this.currentUser());

  // Modal display signals
  isAuthModalOpen = signal<boolean>(false);
  isOrdersModalOpen = signal<boolean>(false);

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): CustomerUser | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveSession(token: string, user: CustomerUser): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user session to localStorage', e);
    }
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getAuthHeaders(): HttpHeaders {
    const t = this.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(t ? { 'Authorization': `Bearer ${t}` } : {})
    });
  }

  openAuthModal(): void {
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }

  openOrdersModal(): void {
    this.isOrdersModalOpen.set(true);
  }

  closeOrdersModal(): void {
    this.isOrdersModalOpen.set(false);
  }

  sendOtp(phone: string): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/auth/otp/send`, { phone });
  }

  verifyOtp(phone: string, otp: string, name?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/otp/verify`, {
      phone,
      otp,
      name
    }).pipe(
      tap(res => {
        if (res.success && res.access_token && res.user) {
          this.saveSession(res.access_token, res.user);
        }
      })
    );
  }

  loginWithGoogle(payload: { email: string; name?: string; google_id?: string; avatar_url?: string; credential?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/google`, payload).pipe(
      tap(res => {
        if (res.success && res.access_token && res.user) {
          this.saveSession(res.access_token, res.user);
        }
      })
    );
  }

  loadProfile(): Observable<{ success: boolean; user: CustomerUser }> {
    return this.http.get<{ success: boolean; user: CustomerUser }>(
      `${this.baseUrl}/auth/me`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          try {
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          } catch {}
        }
      })
    );
  }

  updateProfile(data: { name?: string; email?: string; default_address?: string }): Observable<{ success: boolean; user: CustomerUser; message: string }> {
    return this.http.put<{ success: boolean; user: CustomerUser; message: string }>(
      `${this.baseUrl}/auth/me`,
      data,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          try {
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          } catch {}
        }
      })
    );
  }

  getMyOrders(): Observable<{ success: boolean; orders: any[]; total: number }> {
    return this.http.get<{ success: boolean; orders: any[]; total: number }>(
      `${this.baseUrl}/auth/orders`,
      { headers: this.getAuthHeaders() }
    );
  }

  logout(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch {}
    this.token.set(null);
    this.currentUser.set(null);
    this.isOrdersModalOpen.set(false);
  }
}
