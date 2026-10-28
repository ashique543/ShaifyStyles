import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="admin-sidebar" [class.collapsed]="collapsed()">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="brand-mark">SS</div>
        @if (!collapsed()) {
          <div class="brand-text">
            <span class="brand-name">Shaify Styles</span>
            <span class="brand-sub">Admin Panel</span>
          </div>
        }
        <button class="collapse-btn" (click)="toggleCollapse.emit()" title="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            @if (collapsed()) {
              <polyline points="9 18 15 12 9 6"></polyline>
            } @else {
              <polyline points="15 18 9 12 15 6"></polyline>
            }
          </svg>
        </button>
      </div>

      <!-- Admin User Badge -->
      @if (!collapsed()) {
        <div class="admin-user-badge">
          <div class="user-avatar">{{ firstLetter() }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.currentAdmin()?.username }}</span>
            <span class="user-role">Store Owner</span>
          </div>
        </div>
      }

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'Dashboard' : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          @if (!collapsed()) { <span>Dashboard</span> }
        </a>

        <a routerLink="/admin/products" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'Products' : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          @if (!collapsed()) { <span>Products</span> }
        </a>

        <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'Orders' : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          @if (!collapsed()) { <span>Orders</span> }
        </a>
      </nav>

      <!-- Sidebar Footer: Logout -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="onLogout()" [title]="collapsed() ? 'Logout' : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          @if (!collapsed()) { <span>Logout</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .admin-sidebar {
      width: 240px;
      height: 100vh;
      background: #1a0f12;
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease;
      position: sticky;
      top: 0;
      flex-shrink: 0;
      border-right: 1px solid rgba(255,255,255,0.05);
    }
    .admin-sidebar.collapsed { width: 68px; }
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.1rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #A3485E, #C5A059);
      color: white;
      font-family: 'Playfair Display', serif;
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(163,72,94,0.4);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
    }
    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      font-weight: 700;
      color: #FAF7F2;
      white-space: nowrap;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: #C5A059;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }
    .collapse-btn {
      margin-left: auto;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
      border: none;
      color: #8E8286;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .collapse-btn:hover { background: rgba(255,255,255,0.1); color: #FAF7F2; }
    .admin-user-badge {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #A3485E 50%, #873649);
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-info { overflow: hidden; }
    .user-name {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #FAF7F2;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .user-role { font-size: 0.72rem; color: #8E8286; }
    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
      border-radius: 8px;
      color: #C0B7B9;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.18s;
    }
    .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: #FAF7F2; }
    .nav-item.active {
      background: rgba(163,72,94,0.25);
      color: #FAF7F2;
      border-left: 3px solid #A3485E;
    }
    .sidebar-footer {
      padding: 0.75rem 0.65rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
      border-radius: 8px;
      background: none;
      border: none;
      color: #8E8286;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.18s;
    }
    .logout-btn svg { width: 18px; height: 18px; }
    .logout-btn:hover { background: rgba(211,47,47,0.15); color: #ef5350; }
  `]
})
export class AdminSidebarComponent {
  auth = inject(AdminAuthService);
  collapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  firstLetter(): string {
    return (this.auth.currentAdmin()?.username?.[0] ?? 'A').toUpperCase();
  }

  onLogout(): void {
    this.auth.logout();
  }
}
