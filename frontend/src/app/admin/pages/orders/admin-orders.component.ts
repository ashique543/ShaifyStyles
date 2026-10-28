import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminOrder } from '../../models/admin.models';
import { AdminToastsComponent } from '../../components/admin-toasts.component';

const STATUS_OPTIONS = ['created', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  created: 'badge-created', paid: 'badge-paid', processing: 'badge-processing',
  shipped: 'badge-shipped', delivered: 'badge-delivered', failed: 'badge-failed', cancelled: 'badge-cancelled'
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToastsComponent],
  template: `
    <app-admin-toasts #toasts></app-admin-toasts>

    <div class="admin-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Order Management</h1>
          <p class="page-subtitle">{{ totalItems() }} total orders</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-inp" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search by name, phone, or payment ID…" />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="loadOrders()">
          <option value="">All Statuses</option>
          @for (s of statuses; track s) { <option [value]="s">{{ s | titlecase }}</option> }
        </select>
        <input type="date" class="filter-date" [(ngModel)]="dateFrom" (change)="loadOrders()" title="From date" />
        <input type="date" class="filter-date" [(ngModel)]="dateTo" (change)="loadOrders()" title="To date" />
        <button class="refresh-btn" (click)="loadOrders()">Refresh</button>
      </div>

      <!-- Table -->
      @if (isLoading()) {
        <div class="table-skeleton">
          @for (_ of [1,2,3,4,5]; track $index) { <div class="row-skeleton"></div> }
        </div>
      } @else {
        <div class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (o of orders(); track o.id) {
                  <tr [class.row-selected]="selectedOrder()?.id === o.id">
                    <td><span class="order-id-cell">#SS-{{ o.id }}</span></td>
                    <td>
                      <div class="customer-cell">
                        <span class="customer-name">{{ o.customer_name }}</span>
                        <span class="customer-email">{{ o.customer_email }}</span>
                      </div>
                    </td>
                    <td>{{ o.customer_phone }}</td>
                    <td>
                      <span class="items-count">{{ o.items?.length || 0 }} item(s)</span>
                    </td>
                    <td><strong>₹{{ o.total_amount | number:'1.0-0' }}</strong></td>
                    <td>
                      <span class="status-badge" [class]="statusColor(o.status)">
                        {{ o.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ o.created_at | date:'MMM d, y' }}</td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn view" (click)="openOrderPanel(o)" title="View & Update">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button class="act-btn whatsapp" (click)="openWhatsApp(o)" title="Send WhatsApp message">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (orders().length === 0) {
                  <tr>
                    <td colspan="8" class="empty-row">No orders found matching your filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (totalPages() > 1) {
            <div class="pagination">
              <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Prev</button>
              <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Next →</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Order Detail Side Panel -->
    @if (selectedOrder()) {
      <div class="panel-overlay" (click)="closePanel()"></div>
      <div class="order-panel">
        <div class="panel-header">
          <h2>Order #SS-{{ selectedOrder()!.id }}</h2>
          <button class="close-panel" (click)="closePanel()">×</button>
        </div>
        <div class="panel-body">
          <!-- Customer Info -->
          <section class="panel-section">
            <h3 class="section-title">Customer Details</h3>
            <div class="info-grid">
              <div class="info-row"><span>Name</span><span>{{ selectedOrder()!.customer_name }}</span></div>
              <div class="info-row"><span>Email</span><span>{{ selectedOrder()!.customer_email }}</span></div>
              <div class="info-row"><span>Phone</span><span>{{ selectedOrder()!.customer_phone }}</span></div>
              <div class="info-row"><span>Address</span><span>{{ selectedOrder()!.shipping_address }}</span></div>
              @if (selectedOrder()!.razorpay_payment_id) {
                <div class="info-row"><span>Payment ID</span><span class="mono">{{ selectedOrder()!.razorpay_payment_id }}</span></div>
              }
              <div class="info-row"><span>Order Date</span><span>{{ selectedOrder()!.created_at | date:'MMMM d, y, h:mm a' }}</span></div>
            </div>
          </section>

          <!-- Order Items -->
          <section class="panel-section">
            <h3 class="section-title">Items Ordered</h3>
            <div class="items-list">
              @for (item of selectedOrder()!.items; track item.id) {
                <div class="order-item-row">
                  <img [src]="item.product_image" [alt]="item.product_title" class="item-thumb" onerror="this.style.display='none'" />
                  <div class="item-details">
                    <span class="item-title">{{ item.product_title }}</span>
                    <span class="item-meta">{{ item.size }} × {{ item.quantity }}</span>
                  </div>
                  <span class="item-price">₹{{ item.subtotal | number:'1.0-0' }}</span>
                </div>
              }
            </div>
            <div class="order-total">
              <strong>Total: ₹{{ selectedOrder()!.total_amount | number:'1.0-0' }}</strong>
            </div>
          </section>

          <!-- Status Update -->
          <section class="panel-section">
            <h3 class="section-title">Update Order Status</h3>
            <div class="update-form">
              <div class="field-row">
                <label>Status</label>
                <select [(ngModel)]="updateForm.status">
                  @for (s of statuses; track s) { <option [value]="s">{{ s | titlecase }}</option> }
                </select>
              </div>
              <div class="field-row">
                <label>Tracking Carrier</label>
                <input type="text" [(ngModel)]="updateForm.tracking_carrier" placeholder="e.g. DTDC, Delhivery, India Post" />
              </div>
              <div class="field-row">
                <label>Tracking Number</label>
                <input type="text" [(ngModel)]="updateForm.tracking_number" placeholder="Enter AWB / consignment no." />
              </div>
              <div class="field-row">
                <label>Notes (internal)</label>
                <textarea [(ngModel)]="updateForm.notes" rows="2" placeholder="Internal notes, special handling…"></textarea>
              </div>
              <button class="btn-update" (click)="saveOrderUpdate()" [disabled]="isSaving()">
                {{ isSaving() ? 'Saving…' : 'Save Update' }}
              </button>
            </div>
          </section>

          <!-- WhatsApp Message Preview -->
          <section class="panel-section">
            <h3 class="section-title">📲 WhatsApp Dispatch Message</h3>
            <div class="wa-preview">
              <pre class="wa-message">{{ buildWhatsAppMessage(selectedOrder()!) }}</pre>
              <button class="wa-btn" (click)="openWhatsApp(selectedOrder()!)">
                Send via WhatsApp
              </button>
            </div>
          </section>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-family: 'Playfair Display', serif; font-size: 1.85rem; color: #252021; margin-bottom: 0.25rem; }
    .page-subtitle { font-size: 0.9rem; color: #8E8286; }
    .filters-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
    .search-wrapper { position: relative; flex: 1; min-width: 240px; }
    .search-ico { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #8E8286; pointer-events: none; }
    .search-inp { width: 100%; padding: 0.6rem 0.75rem 0.6rem 2.25rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-family: inherit; }
    .search-inp:focus { outline: none; border-color: #A3485E; box-shadow: 0 0 0 3px rgba(163,72,94,0.1); }
    .filter-select, .filter-date { padding: 0.6rem 0.75rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-family: inherit; cursor: pointer; }
    .refresh-btn { padding: 0.6rem 1rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .refresh-btn:hover { border-color: #A3485E; color: #A3485E; }
    .table-skeleton { display: flex; flex-direction: column; gap: 0.6rem; }
    .row-skeleton { height: 54px; border-radius: 8px; background: linear-gradient(90deg, #F0E8E1 25%, #F7F1EC 50%, #F0E8E1 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .table-card { background: #FFFFFF; border: 1px solid #E8DFD8; border-radius: 14px; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    thead th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #8E8286; font-weight: 700; padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #E8DFD8; background: #FAF7F2; white-space: nowrap; }
    tbody td { padding: 0.85rem 1rem; font-size: 0.875rem; color: #252021; border-bottom: 1px solid #F4EFE6; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #FDFBF8; }
    tbody tr.row-selected { background: #F9ECEF; }
    .order-id-cell { font-weight: 700; color: #A3485E; font-family: 'Playfair Display', serif; font-size: 1rem; }
    .customer-cell { display: flex; flex-direction: column; }
    .customer-name { font-weight: 600; }
    .customer-email { font-size: 0.75rem; color: #8E8286; }
    .items-count { font-size: 0.8rem; background: #F4EFE6; color: #594F52; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .status-badge { font-size: 0.72rem; font-weight: 700; padding: 0.22rem 0.7rem; border-radius: 9999px; text-transform: capitalize; }
    .badge-paid { background: #E8F5E9; color: #2E7D32; }
    .badge-delivered { background: #E3F2FD; color: #1565C0; }
    .badge-shipped { background: #F3E5F5; color: #7B1FA2; }
    .badge-processing { background: #FFF3E0; color: #E65100; }
    .badge-created { background: #F5F5F5; color: #616161; }
    .badge-failed, .badge-cancelled { background: #FFEBEE; color: #C62828; }
    .action-btns { display: flex; gap: 0.4rem; }
    .act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid #E8DFD8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; background: #FFFFFF; color: #594F52; }
    .act-btn.view:hover { background: #E3F2FD; border-color: #1565C0; color: #1565C0; }
    .act-btn.whatsapp:hover { background: #E8F5E9; border-color: #2E7D32; color: #2E7D32; }
    .empty-row { text-align: center; color: #8E8286; padding: 2rem; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border-top: 1px solid #E8DFD8; font-size: 0.875rem; }
    .pagination button { padding: 0.4rem 0.85rem; border: 1px solid #E8DFD8; border-radius: 6px; background: #FFFFFF; cursor: pointer; font-family: inherit; font-size: 0.875rem; font-weight: 600; transition: all 0.15s; }
    .pagination button:hover:not(:disabled) { border-color: #A3485E; color: #A3485E; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    /* Side Panel */
    .panel-overlay { position: fixed; inset: 0; background: rgba(37,32,33,0.4); z-index: 900; }
    .order-panel {
      position: fixed; top: 0; right: 0; width: 480px; max-width: 95vw; height: 100vh;
      background: #FFFFFF; z-index: 910; box-shadow: -8px 0 32px rgba(37,32,33,0.18);
      display: flex; flex-direction: column; animation: slideInRight 0.25s ease-out;
    }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8DFD8; background: #FAF7F2; flex-shrink: 0; }
    .panel-header h2 { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: #252021; }
    .close-panel { width: 34px; height: 34px; border-radius: 50%; background: #F0E8E1; border: none; font-size: 1.4rem; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #252021; }
    .close-panel:hover { background: #FFEBEE; color: #C62828; }
    .panel-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .panel-section { display: flex; flex-direction: column; gap: 0.75rem; }
    .section-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #252021; border-bottom: 1px solid #E8DFD8; padding-bottom: 0.4rem; }
    .info-grid { display: flex; flex-direction: column; gap: 0.4rem; }
    .info-row { display: flex; gap: 0.75rem; font-size: 0.875rem; }
    .info-row span:first-child { width: 90px; flex-shrink: 0; color: #8E8286; font-weight: 600; }
    .info-row span:last-child { color: #252021; word-break: break-all; }
    .mono { font-family: monospace; font-size: 0.82rem; }
    .items-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .order-item-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem; background: #FAF7F2; border-radius: 8px; }
    .item-thumb { width: 42px; height: 42px; border-radius: 6px; object-fit: cover; border: 1px solid #E8DFD8; flex-shrink: 0; }
    .item-details { flex: 1; display: flex; flex-direction: column; }
    .item-title { font-size: 0.875rem; font-weight: 600; }
    .item-meta { font-size: 0.75rem; color: #8E8286; }
    .item-price { font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .order-total { text-align: right; font-size: 1rem; padding-top: 0.5rem; border-top: 1px solid #E8DFD8; }
    .update-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .field-row { display: flex; flex-direction: column; gap: 0.3rem; }
    .field-row label { font-size: 0.78rem; font-weight: 700; color: #252021; }
    .field-row select, .field-row input, .field-row textarea { padding: 0.6rem 0.75rem; border: 1.5px solid #E8DFD8; border-radius: 8px; background: #FAF7F2; font-size: 0.875rem; font-family: inherit; color: #252021; }
    .field-row select:focus, .field-row input:focus, .field-row textarea:focus { outline: none; border-color: #A3485E; background: #FFFFFF; }
    .btn-update { padding: 0.7rem; background: linear-gradient(135deg, #A3485E, #873649); color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .btn-update:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-update:disabled { opacity: 0.6; cursor: not-allowed; }
    .wa-preview { display: flex; flex-direction: column; gap: 0.75rem; }
    .wa-message { background: #E8F5E9; border-left: 3px solid #2E7D32; padding: 0.85rem; border-radius: 0 8px 8px 0; font-size: 0.82rem; font-family: monospace; white-space: pre-wrap; word-break: break-word; color: #1B5E20; margin: 0; }
    .wa-btn { padding: 0.7rem 1.25rem; background: #2E7D32; color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .wa-btn:hover { background: #1B5E20; }
    @media (max-width: 600px) { .admin-page { padding: 1rem; } .order-panel { width: 100%; } }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);

  orders = signal<AdminOrder[]>([]);
  selectedOrder = signal<AdminOrder | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  searchQuery = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  statuses = STATUS_OPTIONS;

  updateForm: { status: string; tracking_carrier: string; tracking_number: string; notes: string } = {
    status: '', tracking_carrier: '', tracking_number: '', notes: ''
  };

  toastsRef = viewChild.required(AdminToastsComponent);

  ngOnInit(): void {
    this.loadOrders();
    // If order id was passed as query param (from dashboard link), open it
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.api.getOrder(parseInt(params['id'])).subscribe({
          next: (res) => {
            if (res.success) this.openOrderPanel(res.order);
          }
        });
      }
    });
  }

  private searchTimer: any;
  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage.set(1); this.loadOrders(); }, 400);
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.api.getOrders(this.currentPage(), 20, this.statusFilter, this.searchQuery, this.dateFrom, this.dateTo).subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.pages || 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goToPage(p: number): void { this.currentPage.set(p); this.loadOrders(); }

  statusColor(s: string): string { return STATUS_COLORS[s] || 'badge-created'; }

  openOrderPanel(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.updateForm = {
      status: order.status,
      tracking_carrier: order.tracking_carrier || '',
      tracking_number: order.tracking_number || '',
      notes: order.notes || ''
    };
  }

  closePanel(): void { this.selectedOrder.set(null); }

  saveOrderUpdate(): void {
    const order = this.selectedOrder();
    if (!order) return;
    this.isSaving.set(true);
    this.api.updateOrderStatus(order.id, {
      status: this.updateForm.status,
      tracking_carrier: this.updateForm.tracking_carrier,
      tracking_number: this.updateForm.tracking_number,
      notes: this.updateForm.notes
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedOrder.set(res.order);
          this.toastsRef().show(res.message, 'success');
          this.loadOrders();
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastsRef().show(err.error?.message || 'Update failed', 'error');
        this.isSaving.set(false);
      }
    });
  }

  buildWhatsAppMessage(order: AdminOrder): string {
    const itemLines = (order.items || [])
      .map(i => `• ${i.product_title} (${i.size}) x${i.quantity} – ₹${i.subtotal}`)
      .join('\n');

    const trackingLine = (this.updateForm.tracking_number || order.tracking_number)
      ? `\n🚚 *Carrier:* ${this.updateForm.tracking_carrier || order.tracking_carrier || '—'}\n📦 *Tracking No:* ${this.updateForm.tracking_number || order.tracking_number}`
      : '';

    return `Assalamu Alaikum ${order.customer_name} 🌸

Your *Shaify Styles* order has been confirmed!

*Order #SS-${order.id}*
${itemLines}

💰 *Total:* ₹${order.total_amount}${trackingLine}

Jazak Allah Khair for shopping with us! 🌸
~ Shaify Styles (@shaifystyles_)`;
  }

  openWhatsApp(order: AdminOrder): void {
    const phone = order.customer_phone.replace(/\D/g, '');
    const intl = phone.startsWith('91') ? phone : `91${phone}`;
    const msg = encodeURIComponent(this.buildWhatsAppMessage(order));
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank');
  }
}
