import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';
import { DashboardMetrics, AdminOrder } from '../../models/admin.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard Overview</h1>
          <p class="page-subtitle">Shaify Styles boutique analytics & quick actions</p>
        </div>
        <button class="refresh-btn" (click)="loadMetrics()" [disabled]="isLoading()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 .49-4.92"></path>
          </svg>
          Refresh
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-grid">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (metrics()) {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card revenue">
            <div class="kpi-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Total Revenue</span>
              <span class="kpi-value">₹{{ metrics()!.total_revenue | number:'1.0-0' }}</span>
              <span class="kpi-sub">From paid & delivered orders</span>
            </div>
          </div>

          <div class="kpi-card orders">
            <div class="kpi-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Total Orders</span>
              <span class="kpi-value">{{ metrics()!.total_orders }}</span>
              <span class="kpi-sub">{{ metrics()!.pending_dispatch }} awaiting dispatch</span>
            </div>
          </div>

          <div class="kpi-card pending">
            <div class="kpi-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Pending Dispatch</span>
              <span class="kpi-value">{{ metrics()!.pending_dispatch }}</span>
              <span class="kpi-sub">Paid orders not yet shipped</span>
            </div>
          </div>

          <div class="kpi-card" [class.low-stock-alert]="metrics()!.low_stock_count > 0">
            <div class="kpi-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Low Stock Products</span>
              <span class="kpi-value">{{ metrics()!.low_stock_count }}</span>
              <span class="kpi-sub">Stock below 5 units — restock soon!</span>
            </div>
          </div>
        </div>

        <!-- Status Breakdown Row -->
        <div class="status-breakdown-card">
          <h3 class="section-title">Order Status Breakdown</h3>
          <div class="status-pills-row">
            @for (entry of getStatusEntries(); track entry[0]) {
              <div class="status-pill-item" [class]="'status-' + entry[0]">
                <span class="status-dot"></span>
                <span class="status-label">{{ entry[0] | titlecase }}</span>
                <span class="status-count">{{ entry[1] }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Low Stock Warnings -->
        @if (metrics()!.low_stock_count > 0) {
          <div class="low-stock-section">
            <div class="section-header">
              <h3 class="section-title">⚠️ Low Stock Alerts</h3>
              <a routerLink="/admin/products" class="see-all-link">Manage Products →</a>
            </div>
            <div class="low-stock-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of metrics()!.low_stock_products; track p.id) {
                    <tr [class.out-of-stock]="p.stock === 0">
                      <td>
                        <div class="product-cell">
                          <img [src]="p.image_url" [alt]="p.title" class="product-thumb" onerror="this.style.display='none'" />
                          <span>{{ p.title }}</span>
                        </div>
                      </td>
                      <td><span class="category-tag">{{ p.category }}</span></td>
                      <td>₹{{ (p.discounted_price ?? p.price) | number:'1.0-0' }}</td>
                      <td>
                        <span class="stock-badge" [class.zero]="p.stock === 0">
                          {{ p.stock === 0 ? 'Out of Stock' : p.stock + ' left' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Recent Orders Table -->
        <div class="recent-orders-section">
          <div class="section-header">
            <h3 class="section-title">Recent Orders</h3>
            <a routerLink="/admin/orders" class="see-all-link">View All Orders →</a>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (o of recentOrders(); track o.id) {
                  <tr>
                    <td><span class="order-id">#SS-{{ o.id }}</span></td>
                    <td>{{ o.customer_name }}</td>
                    <td>{{ o.customer_phone }}</td>
                    <td><strong>₹{{ o.total_amount | number:'1.0-0' }}</strong></td>
                    <td>
                      <span class="status-badge" [class]="'badge-' + o.status">
                        {{ o.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ o.created_at | date:'MMM d, y' }}</td>
                    <td>
                      <a [routerLink]="['/admin/orders']" [queryParams]="{ id: o.id }" class="view-link">View</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.85rem;
      color: #252021;
      margin-bottom: 0.25rem;
    }
    .page-subtitle { font-size: 0.9rem; color: #8E8286; }
    .refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.1rem;
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #252021;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .refresh-btn:hover { border-color: #A3485E; color: #A3485E; }
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .skeleton-card {
      height: 120px;
      border-radius: 14px;
      background: linear-gradient(90deg, #F0E8E1 25%, #F7F1EC 50%, #F0E8E1 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 6px 20px rgba(37,32,33,0.07); transform: translateY(-2px); }
    .kpi-card.low-stock-alert { border-color: #F57C00; background: #FFFDE7; }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon-wrap svg { width: 22px; height: 22px; }
    .kpi-card.revenue .kpi-icon-wrap { background: #E8F5E9; color: #2E7D32; }
    .kpi-card.orders .kpi-icon-wrap { background: #E3F2FD; color: #1565C0; }
    .kpi-card.pending .kpi-icon-wrap { background: #FFF3E0; color: #E65100; }
    .kpi-card:not(.revenue):not(.orders):not(.pending) .kpi-icon-wrap { background: #FFF9C4; color: #F57F17; }
    .kpi-body { display: flex; flex-direction: column; gap: 0.15rem; }
    .kpi-label { font-size: 0.78rem; color: #8E8286; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-value { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: #252021; font-weight: 700; line-height: 1.1; }
    .kpi-sub { font-size: 0.75rem; color: #8E8286; margin-top: 0.15rem; }
    .status-breakdown-card {
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
    }
    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.15rem;
      color: #252021;
      margin-bottom: 1rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .see-all-link {
      font-size: 0.85rem;
      color: #A3485E;
      font-weight: 600;
      text-decoration: none;
    }
    .see-all-link:hover { text-decoration: underline; }
    .status-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .status-pill-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      background: #FAF7F2;
      border: 1px solid #E8DFD8;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-paid .status-dot { background: #2E7D32; }
    .status-delivered .status-dot { background: #1565C0; }
    .status-shipped .status-dot { background: #7B1FA2; }
    .status-processing .status-dot { background: #E65100; }
    .status-created .status-dot { background: #8E8286; }
    .status-failed .status-dot, .status-cancelled .status-dot { background: #C62828; }
    .status-label { color: #252021; }
    .status-count {
      background: rgba(37,32,33,0.08);
      padding: 0.05rem 0.4rem;
      border-radius: 9999px;
      font-size: 0.78rem;
    }
    .low-stock-section, .recent-orders-section {
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
    }
    .low-stock-table, .data-table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #8E8286;
      font-weight: 700;
      padding: 0 0 0.65rem;
      text-align: left;
      border-bottom: 1px solid #E8DFD8;
    }
    tbody td {
      padding: 0.75rem 0;
      font-size: 0.875rem;
      color: #252021;
      border-bottom: 1px solid #F4EFE6;
      vertical-align: middle;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr.out-of-stock { background: #FFF9C4; }
    .product-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .product-thumb {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #E8DFD8;
    }
    .category-tag {
      font-size: 0.72rem;
      background: #F9ECEF;
      color: #873649;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .stock-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: #FFF3E0;
      color: #E65100;
    }
    .stock-badge.zero { background: #FFEBEE; color: #C62828; }
    .order-id { font-weight: 700; color: #A3485E; font-family: 'Playfair Display', serif; }
    .status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.22rem 0.7rem;
      border-radius: 9999px;
      text-transform: capitalize;
    }
    .badge-paid { background: #E8F5E9; color: #2E7D32; }
    .badge-delivered { background: #E3F2FD; color: #1565C0; }
    .badge-shipped { background: #F3E5F5; color: #7B1FA2; }
    .badge-processing { background: #FFF3E0; color: #E65100; }
    .badge-created { background: #F5F5F5; color: #616161; }
    .badge-failed, .badge-cancelled { background: #FFEBEE; color: #C62828; }
    .view-link { color: #A3485E; font-size: 0.8rem; font-weight: 600; text-decoration: none; }
    .view-link:hover { text-decoration: underline; }
    .data-table { min-width: 700px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } .admin-page { padding: 1rem; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(AdminApiService);

  isLoading = signal(true);
  metrics = signal<DashboardMetrics | null>(null);
  recentOrders = signal<AdminOrder[]>([]);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this.api.getMetrics().subscribe({
      next: (res) => {
        if (res.success) {
          this.metrics.set(res.metrics);
          this.recentOrders.set(res.recent_orders || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getStatusEntries(): [string, number][] {
    const m = this.metrics();
    if (!m?.orders_by_status) return [];
    return Object.entries(m.orders_by_status);
  }
}
