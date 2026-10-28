import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Admin } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly TOKEN_KEY = 'shaify_admin_token';
  private readonly ADMIN_KEY = 'shaify_admin_user';

  private router = inject(Router);

  currentAdmin = signal<Admin | null>(this.loadAdminFromStorage());
  isAuthenticated = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));

  private loadAdminFromStorage(): Admin | null {
    try {
      const raw = localStorage.getItem(this.ADMIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  saveSession(token: string, admin: Admin): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(admin));
    this.currentAdmin.set(admin);
    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_KEY);
    this.currentAdmin.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/admin/login']);
  }
}
