import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { ApiService } from '../../services/api.service';

export interface TimelineStep {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-orders-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-modal.component.html'
})
export class OrdersModalComponent implements OnInit {
  authService = inject(CustomerAuthService);
  private apiService = inject(ApiService);
  orders: any[] = [];
  isLoading: boolean = false;

  readonly timelineSteps: TimelineStep[] = [
    { key: 'created', label: 'Placed', icon: '📝' },
    { key: 'paid', label: 'Paid', icon: '💳' },
    { key: 'processing', label: 'Packing', icon: '📦' },
    { key: 'shipped', label: 'In Transit', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎁' }
  ];

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.authService.getMyOrders().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.orders = res.orders || [];
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getStepIndex(status: string): number {
    const s = (status || 'created').toLowerCase();
    switch (s) {
      case 'created': return 0;
      case 'paid': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  }

  isStepCompleted(orderStatus: string, stepIndex: number): boolean {
    return this.getStepIndex(orderStatus) >= stepIndex;
  }

  isCurrentStep(orderStatus: string, stepIndex: number): boolean {
    return this.getStepIndex(orderStatus) === stepIndex;
  }

  downloadInvoice(orderId: number): void {
    this.apiService.downloadInvoice(orderId);
  }

  getTrackingUrl(carrier?: string, trackingNo?: string): string {
    if (!trackingNo) return '#';
    const c = (carrier || '').toLowerCase();
    if (c.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${trackingNo}`;
    }
    if (c.includes('dtdc')) {
      return `https://www.dtdc.in/`;
    }
    if (c.includes('bluedart')) {
      return `https://www.bluedart.com/`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent((carrier || 'courier') + ' tracking ' + trackingNo)}`;
  }

  close(): void {
    this.authService.closeOrdersModal();
  }

  onBackdropClick(event: MouseEvent): void {
    this.close();
  }
}
