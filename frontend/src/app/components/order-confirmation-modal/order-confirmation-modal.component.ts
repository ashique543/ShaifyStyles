import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDetail } from '../../models/product.model';

@Component({
  selector: 'app-order-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (order()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="receipt-dialog" (click)="$event.stopPropagation()">
          <!-- Celebration Header -->
          <div class="receipt-header">
            <div class="success-ring">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 class="success-title">Order Confirmed!</h2>
            <p class="success-subtitle">
              Thank you, <strong>{{ order()!.customer_name }}</strong>! We have received your payment and our boutique team is preparing your order.
            </p>
          </div>

          <!-- Order Summary Meta Grid -->
          <div class="order-meta-grid">
            <div class="meta-cell">
              <span class="meta-label">Order Number</span>
              <span class="meta-val highlight">#SS-{{ order()!.id }}</span>
            </div>
            <div class="meta-cell">
              <span class="meta-label">Payment ID</span>
              <span class="meta-val">{{ order()!.razorpay_payment_id || 'Captured' }}</span>
            </div>
            <div class="meta-cell">
              <span class="meta-label">Order Date</span>
              <span class="meta-val">{{ order()!.created_at | date:'mediumDate' }}</span>
            </div>
            <div class="meta-cell">
              <span class="meta-label">Payment Status</span>
              <span class="meta-val status-paid">● Paid via Razorpay</span>
            </div>
          </div>

          <!-- Items Ordered Breakdown -->
          <div class="receipt-section">
            <h4 class="section-title">Items Ordered ({{ order()!.items.length }})</h4>
            <div class="items-receipt-list">
              @for (item of order()!.items; track item.id) {
                <div class="receipt-item-row">
                  <div class="item-name-col">
                    <span class="item-title">{{ item.product_title }}</span>
                    <span class="item-sub">Size: {{ item.size }} • Qty: {{ item.quantity }}</span>
                  </div>
                  <span class="item-price-val">₹{{ item.subtotal | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Delivery Details & Total -->
          <div class="receipt-section delivery-box">
            <h4 class="section-title">Shipping Address</h4>
            <p class="address-text">{{ order()!.shipping_address }}</p>
            <p class="contact-text">Contact: {{ order()!.customer_phone }} | {{ order()!.customer_email }}</p>

            @if (order()!.notes) {
              <div class="gift-note-box">
                <strong>Personalized Note / Instructions:</strong>
                <p>"{{ order()!.notes }}"</p>
              </div>
            }

            <div class="total-receipt-line">
              <span class="total-label">Total Amount Paid:</span>
              <span class="total-amount">₹{{ order()!.total_amount | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="receipt-actions">
            <a 
              [href]="getWhatsAppTrackingUrl()" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-whatsapp wa-track-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
              </svg>
              <span>Track / Chat on WhatsApp</span>
            </a>

            <button type="button" class="btn btn-secondary continue-btn" (click)="close.emit()">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .receipt-dialog {
      background: #FFFFFF;
      border-radius: 24px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2.25rem;
      border: 1px solid #E8DFD8;
      box-shadow: 0 25px 60px rgba(37, 32, 33, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .receipt-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.75rem;
    }
    .success-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #E8F5E9;
      color: #2E7D32;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(46, 125, 50, 0.2);
    }
    .success-title {
      font-size: 1.85rem;
      color: #252021;
    }
    .success-subtitle {
      font-size: 0.95rem;
      color: #594F52;
      max-width: 440px;
      line-height: 1.5;
    }
    .order-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      background: #FAF7F2;
      padding: 1.25rem;
      border-radius: 14px;
      border: 1px solid #E8DFD8;
      margin-bottom: 1.5rem;
    }
    .meta-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .meta-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8E8286;
      font-weight: 600;
    }
    .meta-val {
      font-size: 0.95rem;
      font-weight: 600;
      color: #252021;
    }
    .meta-val.highlight {
      color: #A3485E;
      font-family: var(--font-serif);
      font-size: 1.1rem;
    }
    .status-paid {
      color: #2E7D32;
    }
    .receipt-section {
      margin-bottom: 1.25rem;
    }
    .section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #873649;
      font-weight: 700;
      margin-bottom: 0.65rem;
    }
    .items-receipt-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      border: 1px solid #E8DFD8;
      border-radius: 12px;
      padding: 0.85rem 1rem;
    }
    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #F4EFE6;
    }
    .receipt-item-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .item-name-col {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .item-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #252021;
    }
    .item-sub {
      font-size: 0.75rem;
      color: #8E8286;
    }
    .item-price-val {
      font-family: var(--font-serif);
      font-weight: 700;
      color: #252021;
    }
    .delivery-box {
      background: #FDFBF8;
      border: 1px solid #E8DFD8;
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .address-text {
      font-size: 0.9rem;
      color: #252021;
      margin-bottom: 0.25rem;
    }
    .contact-text {
      font-size: 0.8rem;
      color: #8E8286;
    }
    .gift-note-box {
      margin-top: 0.75rem;
      background: #F9ECEF;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #873649;
    }
    .total-receipt-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #C5A059;
    }
    .total-label {
      font-weight: 700;
      font-size: 1rem;
      color: #252021;
    }
    .total-amount {
      font-family: var(--font-serif);
      font-size: 1.45rem;
      font-weight: 700;
      color: #A3485E;
    }
    .receipt-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .wa-track-btn {
      width: 100%;
      padding: 0.9rem;
      font-size: 0.95rem;
      gap: 0.5rem;
    }
    .continue-btn {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  `]
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
