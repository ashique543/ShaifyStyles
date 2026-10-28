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
  templateUrl: './admin-orders.component.html'
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);
  toasts = viewChild<AdminToastsComponent>('toasts');

  orders = signal<AdminOrder[]>([]);
  totalItems = signal(0);
  isLoading = signal(true);
  isSaving = signal(false);

  statuses = STATUS_OPTIONS;

  searchQuery = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  currentPage = 1;

  selectedOrder = signal<AdminOrder | null>(null);

  updateForm = {
    status: '',
    tracking_carrier: '',
    tracking_number: '',
    notes: ''
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.searchQuery = params['id'];
      }
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.api.getOrders(
      this.currentPage, 50,
      this.statusFilter,
      this.searchQuery,
      this.dateFrom,
      this.dateTo
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders.set(res.orders);
          this.totalItems.set(res.total);

          const autoSelectId = this.route.snapshot.queryParams['id'];
          if (autoSelectId) {
            const found = res.orders.find((o: AdminOrder) => String(o.id) === String(autoSelectId));
            if (found) this.selectOrder(found);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toasts()?.show('Failed to load orders', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  getStatusClass(status: string): string {
    return STATUS_COLORS[status] || 'badge-created';
  }

  selectOrder(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.updateForm = {
      status: order.status,
      tracking_carrier: order.tracking_carrier || '',
      tracking_number: order.tracking_number || '',
      notes: order.notes || ''
    };
  }

  saveOrderUpdate(): void {
    const o = this.selectedOrder();
    if (!o) return;

    this.isSaving.set(true);
    this.api.updateOrderStatus(o.id, this.updateForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toasts()?.show(`Order #SS-${o.id} updated to "${res.order.status}"`, 'success');
          this.selectedOrder.set(res.order);
          this.loadOrders();
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toasts()?.show(err.error?.message || 'Failed to update order', 'error');
        this.isSaving.set(false);
      }
    });
  }

  buildWhatsAppMessage(o: AdminOrder): string {
    const carrier = this.updateForm.tracking_carrier || o.tracking_carrier || 'our courier partner';
    const tracking = this.updateForm.tracking_number || o.tracking_number || 'will be updated shortly';
    const itemsList = o.items.map(i => `• ${i.product_title} (${i.size}) x${i.quantity}`).join('\n');

    if (this.updateForm.status === 'shipped') {
      return `Salam ${o.customer_name}! 🌸\n\nGreat news from *Shaify Styles*! Your order *#SS-${o.id}* has been dispatched via *${carrier}* with Tracking / AWB: *${tracking}*.\n\nItems in parcel:\n${itemsList}\n\nTotal Paid: ₹${o.total_amount}\nDelivery Address: ${o.shipping_address}\n\nThank you for shopping modest elegance with us! ✨`;
    }

    if (this.updateForm.status === 'delivered') {
      return `Salam ${o.customer_name}! 💖\n\nYour *Shaify Styles* order *#SS-${o.id}* has been successfully delivered! We hope you love your modest pieces & handcrafted bouquets.\n\nPlease tag us on Instagram *@shaifystyles_* when you unbox! 🌸`;
    }

    return `Salam ${o.customer_name}! 🌸\n\nYour *Shaify Styles* order *#SS-${o.id}* is currently *${(this.updateForm.status || o.status).toUpperCase()}*.\n\nItems:\n${itemsList}\nTotal: ₹${o.total_amount}\n\nIf you have any questions, reply here! 🌹`;
  }

  openWhatsApp(o: AdminOrder): void {
    const cleanPhone = o.customer_phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const text = encodeURIComponent(this.buildWhatsAppMessage(o));
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  }
}
