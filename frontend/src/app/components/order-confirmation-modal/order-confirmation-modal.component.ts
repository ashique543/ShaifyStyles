import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDetail } from '../../models/product.model';

@Component({
  selector: 'app-order-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-confirmation-modal.component.html'
})
export class OrderConfirmationModalComponent {
  order = input<OrderDetail | null>(null);
  close = output<void>();

  getWhatsAppTrackingUrl(): string {
    const o = this.order();
    if (!o) return '#';
    const msg = `Hello Shaify Styles (@shaifystyles_)! I placed order #SS-${o.id} for ₹${o.total_amount}. Here is my Razorpay Payment ID: ${o.razorpay_payment_id}. Please confirm dispatch details!`;
    return `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
  }
}
