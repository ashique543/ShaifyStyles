import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-screen">
      <!-- Left Branding Panel -->
      <div class="brand-panel">
        <div class="brand-glow"></div>
        <div class="brand-content">
          <div class="brand-logo-mark">SS</div>
          <h1 class="brand-name">Shaify Styles</h1>
          <p class="brand-tagline">Admin Control Panel</p>
          <div class="brand-features">
            <div class="feat">📊 Live Sales Dashboard</div>
            <div class="feat">📦 Product Management</div>
            <div class="feat">🚚 Order Fulfilment</div>
            <div class="feat">📤 Image Upload & Storage</div>
          </div>
        </div>
        <div class="brand-footer">instagram.com/shaifystyles_</div>
      </div>

      <!-- Right Login Card -->
      <div class="login-panel">
        <div class="login-card">
          <div class="card-header">
            <div class="lock-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Boutique Admin Login</h2>
            <p>Access the Shaify Styles management panel</p>
          </div>

          <form class="login-form" (ngSubmit)="onSubmit()">
            <div class="field-group">
              <label for="admin-username">Username</label>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="admin-username"
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="e.g. admin"
                  autocomplete="username"
                  required
                />
              </div>
            </div>

            <div class="field-group">
              <label for="admin-password">Password</label>
              <div class="input-wrapper">
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="admin-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Your admin password"
                  autocomplete="current-password"
                  required
                />
                <button type="button" class="toggle-pw" (click)="showPassword.update(v => !v)">
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  }
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" class="login-btn" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
                <span>Authenticating…</span>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Sign In to Admin Panel</span>
              }
            </button>
          </form>

          <div class="card-footer">
            <a href="/" class="back-to-store">← Back to Shaify Styles Store</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .admin-login-screen {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: 100vh;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .brand-panel {
      background: linear-gradient(145deg, #1a0f12 0%, #2d1520 40%, #3d1e2a 100%);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }
    .brand-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(163,72,94,0.35) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .brand-content {
      position: relative;
      text-align: center;
      z-index: 1;
    }
    .brand-logo-mark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #A3485E, #C5A059);
      color: white;
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 8px 32px rgba(163,72,94,0.5);
    }
    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 2.5rem;
      color: #FAF7F2;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .brand-tagline {
      color: #C5A059;
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 2.5rem;
    }
    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .feat {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      color: #E8DFD8;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .brand-footer {
      position: absolute;
      bottom: 1.5rem;
      color: rgba(255,255,255,0.35);
      font-size: 0.8rem;
    }
    .login-panel {
      background: #FAF7F2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
    }
    .card-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .lock-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #F9ECEF;
      border: 1px solid rgba(163,72,94,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: #A3485E;
    }
    .lock-icon svg { width: 26px; height: 26px; }
    .card-header h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      color: #252021;
      margin-bottom: 0.35rem;
    }
    .card-header p {
      font-size: 0.9rem;
      color: #8E8286;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .field-group label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #252021;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .field-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #8E8286;
      pointer-events: none;
    }
    .input-wrapper input {
      width: 100%;
      padding: 0.75rem 2.8rem 0.75rem 2.5rem;
      border: 1.5px solid #E8DFD8;
      border-radius: 10px;
      background: #FFFFFF;
      font-size: 0.95rem;
      color: #252021;
      font-family: inherit;
      transition: all 0.2s;
    }
    .input-wrapper input:focus {
      outline: none;
      border-color: #A3485E;
      box-shadow: 0 0 0 3px rgba(163,72,94,0.12);
    }
    .toggle-pw {
      position: absolute;
      right: 12px;
      color: #8E8286;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
    }
    .toggle-pw:hover { color: #A3485E; }
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #FFEBEE;
      color: #D32F2F;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid #FFCDD2;
    }
    .login-btn {
      width: 100%;
      padding: 0.85rem;
      background: linear-gradient(135deg, #A3485E, #873649);
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: all 0.2s;
      margin-top: 0.5rem;
      box-shadow: 0 4px 16px rgba(163,72,94,0.35);
    }
    .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(163,72,94,0.45);
    }
    .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .card-footer {
      text-align: center;
      margin-top: 1.5rem;
    }
    .back-to-store {
      font-size: 0.85rem;
      color: #8E8286;
      text-decoration: none;
      transition: color 0.2s;
    }
    .back-to-store:hover { color: #A3485E; }
    @media (max-width: 768px) {
      .admin-login-screen { grid-template-columns: 1fr; }
      .brand-panel { display: none; }
    }
  `]
})
export class AdminLoginComponent {
  private api = inject(AdminApiService);
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);

  onSubmit(): void {
    if (!this.username.trim() || !this.password) {
      this.errorMsg.set('Please enter both username and password');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.api.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        if (res.success && res.access_token) {
          this.auth.saveSession(res.access_token, res.admin);
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMsg.set(res.message || 'Login failed. Check credentials.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Login failed. Check your credentials.');
        this.isLoading.set(false);
      }
    });
  }
}
