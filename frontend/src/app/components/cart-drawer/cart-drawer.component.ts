import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { OrderDetail } from '../../models/product.model';

declare var Razorpay: any;

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (cartService.isCartOpen()) {
      <div class="drawer-overlay" (click)="cartService.closeCart()">
        <aside class="cart-drawer" (click)="$event.stopPropagation()">
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="header-title-group">
              <h2 class="drawer-title">Shopping Bag</h2>
              <span class="items-count">({{ cartService.totalCount() }} items)</span>
            </div>
            <button type="button" class="close-drawer-btn" (click)="cartService.closeCart()" aria-label="Close Bag">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Free Shipping Tracker -->
          <div class="shipping-tracker">
            <div class="tracker-text">
              @if (cartService.isFreeShippingEligible()) {
                <span class="free-shipping-success">🎉 Congratulations! You unlocked <strong>FREE Pan-India Shipping</strong></span>
              } @else {
                <span>Add <strong>₹{{ cartService.amountForFreeShipping() | number:'1.0-0' }}</strong> more for <strong>FREE Shipping</strong></span>
              }
            </div>
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                [style.width.%]="getProgressPercentage()">
              </div>
            </div>
          </div>

          <!-- Drawer Body: Either Empty Cart OR Items List & Checkout Form -->
          <div class="drawer-content">
            @if (cartService.items().length === 0) {
              <div class="empty-cart-state">
                <div class="empty-icon-circle">🛍️</div>
                <h3>Your bag is empty</h3>
                <p>Explore our handcrafted bouquets, Pakistani lawn suits, and bespoke hampers.</p>
                <button type="button" class="btn btn-primary" (click)="cartService.closeCart()">
                  Browse Collections
                </button>
              </div>
            } @else {
              <!-- Step Indicator: Bag Items vs Shipping Details -->
              <div class="checkout-tabs">
                <button 
                  type="button" 
                  class="tab-btn" 
                  [class.active]="step() === 'items'"
                  (click)="step.set('items')">
                  1. Bag Items ({{ cartService.totalCount() }})
                </button>
                <button 
                  type="button" 
                  class="tab-btn" 
                  [class.active]="step() === 'shipping'"
                  (click)="proceedToShipping()">
                  2. Delivery & Payment
                </button>
              </div>

              @if (step() === 'items') {
                <!-- Items List -->
                <div class="items-list">
                  @for (item of cartService.items(); track $index) {
                    <div class="cart-item-card">
                      <img 
                        [src]="item.product.image_url" 
                        [alt]="item.product.title" 
                        class="item-thumb"
                        onerror="this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'"
                      />
                      <div class="item-details">
                        <div class="item-header-row">
                          <h4 class="item-name">{{ item.product.title }}</h4>
                          <button type="button" class="remove-btn" (click)="cartService.removeItem($index)" title="Remove item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>

                        <span class="item-size-pill">Size: {{ item.size }}</span>

                        <div class="item-bottom-row">
                          <div class="stepper-mini">
                            <button type="button" (click)="cartService.updateQuantity($index, item.quantity - 1)">-</button>
                            <span>{{ item.quantity }}</span>
                            <button type="button" (click)="cartService.updateQuantity($index, item.quantity + 1)">+</button>
                          </div>
                          <span class="item-subtotal">₹{{ ((item.product.discounted_price ?? item.product.price) * item.quantity) | number:'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- Shipping Address & Contact Form -->
                <form class="shipping-form" (ngSubmit)="processCheckout()">
                  <div class="form-section-title">
                    <span>Contact Information</span>
                  </div>

                  <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" [(ngModel)]="customerName" name="customerName" placeholder="e.g. Aisha Khan" required />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>WhatsApp / Phone *</label>
                      <input type="tel" [(ngModel)]="customerPhone" name="customerPhone" placeholder="10-digit mobile" required />
                    </div>
                    <div class="form-group">
                      <label>Email Address *</label>
                      <input type="email" [(ngModel)]="customerEmail" name="customerEmail" placeholder="aisha@example.com" required />
                    </div>
                  </div>

                  <div class="form-section-title">
                    <span>Delivery Address (Pan India)</span>
                  </div>

                  <div class="form-group">
                    <label>Street / Flat / House No. *</label>
                    <input type="text" [(ngModel)]="shippingStreet" name="shippingStreet" placeholder="e.g. Flat 301, Rose Residency, Bandra West" required />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>City *</label>
                      <input type="text" [(ngModel)]="shippingCity" name="shippingCity" placeholder="Mumbai" required />
                    </div>
                    <div class="form-group">
                      <label>PIN Code *</label>
                      <input type="text" [(ngModel)]="shippingPincode" name="shippingPincode" placeholder="400050" required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>State *</label>
                    <input type="text" [(ngModel)]="shippingState" name="shippingState" placeholder="Maharashtra" required />
                  </div>

                  <div class="form-group">
                    <label>Personalized Greeting Note / Custom Instructions (Optional)</label>
                    <textarea 
                      [(ngModel)]="orderNotes" 
                      name="orderNotes" 
                      rows="2" 
                      placeholder="e.g. 'Happy Birthday Amira! - from Zara' or custom bouquet ribbon colors">
                    </textarea>
                  </div>

                  <!-- Payment Mode Badge -->
                  <div class="payment-badge-box">
                    <div class="rzp-brand-row">
                      <span class="rzp-label">Secured by <strong>Razorpay</strong></span>
                      <span class="secure-icon">🔒 100% Secure Payment</span>
                    </div>
                    <p class="rzp-desc">Supports UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.</p>
                  </div>

                  @if (errorMessage()) {
                    <div class="error-banner">
                      ⚠️ {{ errorMessage() }}
                    </div>
                  }
                </form>
              }
            }
          </div>

          <!-- Drawer Footer: Summary & Checkout Button -->
          @if (cartService.items().length > 0) {
            <div class="drawer-footer">
              <div class="summary-line">
                <span class="label">Subtotal:</span>
                <span class="val">₹{{ cartService.subtotal() | number:'1.0-0' }}</span>
              </div>
              <div class="summary-line">
                <span class="label">Pan-India Delivery:</span>
                <span class="val">
                  @if (cartService.isFreeShippingEligible()) {
                    <span class="free-text">FREE</span>
                  } @else {
                    <span>₹150</span>
                  }
                </span>
              </div>
              <div class="summary-line total-line">
                <span class="label">Total Amount:</span>
                <span class="total-val">₹{{ finalTotal() | number:'1.0-0' }}</span>
              </div>

              @if (step() === 'items') {
                <button type="button" class="btn btn-primary checkout-action-btn" (click)="proceedToShipping()">
                  <span>Proceed to Delivery & Payment</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              } @else {
                <button 
                  type="button" 
                  class="btn btn-primary checkout-action-btn" 
                  [disabled]="isProcessing()"
                  (click)="processCheckout()">
                  @if (isProcessing()) {
                    <span class="spinner-inline"></span>
                    <span>Connecting Payment Gateway...</span>
                  } @else {
                    <span>Pay ₹{{ finalTotal() | number:'1.0-0' }} via Razorpay</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                  }
                </button>
                <button type="button" class="back-to-items-link" (click)="step.set('items')">
                  ← Back to Bag Items
                </button>
              }
            </div>
          }
        </aside>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(37, 32, 33, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.25s ease-out;
    }
    .cart-drawer {
      background: #FFFFFF;
      width: 100%;
      max-width: 480px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 32px rgba(37, 32, 33, 0.2);
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #E8DFD8;
      background: #FAF7F2;
    }
    .header-title-group {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .drawer-title {
      font-size: 1.35rem;
      color: #252021;
    }
    .items-count {
      font-size: 0.85rem;
      color: #8E8286;
      font-weight: 500;
    }
    .close-drawer-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #252021;
      cursor: pointer;
      transition: all 0.2s;
    }
    .close-drawer-btn:hover {
      background: #F9ECEF;
      color: #A3485E;
    }
    .shipping-tracker {
      background: #FDFBF8;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #E8DFD8;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .tracker-text {
      font-size: 0.8rem;
      color: #594F52;
    }
    .free-shipping-success {
      color: #2E7D32;
    }
    .progress-bar-bg {
      height: 6px;
      background: #E8DFD8;
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #C5A059, #A3485E);
      transition: width 0.4s ease;
    }
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
    }
    .empty-cart-state {
      text-align: center;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #F9ECEF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
    }
    .checkout-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #E8DFD8;
      padding-bottom: 0.5rem;
    }
    .tab-btn {
      padding: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #8E8286;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: #A3485E;
      border-bottom-color: #A3485E;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .cart-item-card {
      display: flex;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #F0E8E1;
    }
    .item-thumb {
      width: 75px;
      height: 95px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #E8DFD8;
    }
    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .item-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .item-name {
      font-size: 0.95rem;
      color: #252021;
      font-family: var(--font-sans);
      font-weight: 600;
      line-height: 1.3;
    }
    .remove-btn {
      color: #8E8286;
      cursor: pointer;
      padding: 0.2rem;
      transition: color 0.2s;
    }
    .remove-btn:hover {
      color: #D32F2F;
    }
    .item-size-pill {
      font-size: 0.75rem;
      color: #873649;
      background: #F9ECEF;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      align-self: flex-start;
      font-weight: 600;
    }
    .item-bottom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.35rem;
    }
    .stepper-mini {
      display: flex;
      align-items: center;
      border: 1px solid #E8DFD8;
      border-radius: 6px;
      background: #FFFFFF;
    }
    .stepper-mini button {
      width: 26px;
      height: 26px;
      font-weight: 700;
      color: #252021;
      cursor: pointer;
      background: #FAF7F2;
    }
    .stepper-mini span {
      width: 26px;
      text-align: center;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .item-subtotal {
      font-weight: 700;
      font-family: var(--font-serif);
      font-size: 1.05rem;
      color: #252021;
    }
    .shipping-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .form-section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #A3485E;
      font-weight: 700;
      margin-top: 0.5rem;
      border-bottom: 1px solid #F0E8E1;
      padding-bottom: 0.3rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #252021;
    }
    .form-group input, .form-group textarea {
      padding: 0.65rem 0.85rem;
      border: 1px solid #E8DFD8;
      border-radius: 8px;
      background: #FAF7F2;
      color: #252021;
      transition: all 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: #A3485E;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(163, 72, 94, 0.12);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .payment-badge-box {
      background: #F4EFE6;
      padding: 0.85rem;
      border-radius: 10px;
      border: 1px solid #E8DFD8;
      margin-top: 0.5rem;
    }
    .rzp-brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: #252021;
      margin-bottom: 0.2rem;
    }
    .secure-icon {
      font-size: 0.75rem;
      color: #2E7D32;
      font-weight: 600;
    }
    .rzp-desc {
      font-size: 0.75rem;
      color: #594F52;
    }
    .error-banner {
      background: #FFEBEE;
      color: #D32F2F;
      padding: 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .drawer-footer {
      padding: 1.25rem 1.5rem;
      background: #FAF7F2;
      border-top: 1px solid #E8DFD8;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #594F52;
    }
    .free-text {
      color: #2E7D32;
      font-weight: 700;
    }
    .total-line {
      border-top: 1px dashed #E8DFD8;
      padding-top: 0.65rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #252021;
    }
    .total-val {
      font-family: var(--font-serif);
      font-size: 1.35rem;
      color: #A3485E;
    }
    .checkout-action-btn {
      width: 100%;
      padding: 0.9rem;
      font-size: 1rem;
    }
    .back-to-items-link {
      font-size: 0.8rem;
      color: #8E8286;
      text-align: center;
      cursor: pointer;
      margin-top: 0.25rem;
    }
    .back-to-items-link:hover {
      color: #A3485E;
      text-decoration: underline;
    }
    .spinner-inline {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  private apiService = inject(ApiService);

  orderConfirmed = output<OrderDetail>();

  step = signal<'items' | 'shipping'>('items');
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Form Fields
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  shippingStreet = '';
  shippingCity = '';
  shippingState = '';
  shippingPincode = '';
  orderNotes = '';

  getProgressPercentage(): number {
    const sub = this.cartService.subtotal();
    const thresh = this.cartService.freeShippingThreshold;
    return Math.min(100, Math.round((sub / thresh) * 100));
  }

  finalTotal(): number {
    const sub = this.cartService.subtotal();
    const shipping = this.cartService.isFreeShippingEligible() ? 0 : 150;
    return sub + shipping;
  }

  proceedToShipping(): void {
    if (this.cartService.items().length === 0) return;
    this.step.set('shipping');
  }

  validateForm(): boolean {
    if (!this.customerName.trim()) {
      this.errorMessage.set('Please enter your full name');
      return false;
    }
    if (!this.customerPhone.trim() || this.customerPhone.length < 10) {
      this.errorMessage.set('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!this.customerEmail.trim() || !this.customerEmail.includes('@')) {
      this.errorMessage.set('Please enter a valid email address');
      return false;
    }
    if (!this.shippingStreet.trim()) {
      this.errorMessage.set('Please enter your street address');
      return false;
    }
    if (!this.shippingCity.trim() || !this.shippingState.trim() || !this.shippingPincode.trim()) {
      this.errorMessage.set('Please enter City, State, and PIN Code');
      return false;
    }
    this.errorMessage.set(null);
    return true;
  }

  processCheckout(): void {
    if (!this.validateForm()) return;

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const payload = {
      items: this.cartService.items().map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        size: i.size
      })),
      customer_name: this.customerName.trim(),
      customer_email: this.customerEmail.trim(),
      customer_phone: this.customerPhone.trim(),
      shipping_address: `${this.shippingStreet.trim()}, ${this.shippingCity.trim()}, ${this.shippingState.trim()} - ${this.shippingPincode.trim()}`,
      notes: this.orderNotes.trim()
    };

    // 1. Call Backend API to create order
    this.apiService.createOrder(payload).subscribe({
      next: (orderRes) => {
        if (!orderRes.success) {
          this.errorMessage.set(orderRes.message || 'Failed to initialize order');
          this.isProcessing.set(false);
          return;
        }

        // 2. Trigger Razorpay Payment Gateway
        this.launchRazorpay(orderRes);
      },
      error: (err) => {
        console.error('Order creation error:', err);
        this.errorMessage.set(err.error?.message || 'Could not connect to payment server. Please try again.');
        this.isProcessing.set(false);
      }
    });
  }

  private launchRazorpay(orderData: any): void {
    const isMock = orderData.is_mock || typeof Razorpay === 'undefined';

    if (isMock) {
      // Graceful simulated test payment flow for development / test keys
      setTimeout(() => {
        const mockVerifyPayload = {
          razorpay_order_id: orderData.razorpay_order_id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: `sig_demo_${Date.now()}`,
          order_id: orderData.order_id
        };

        this.verifyAndCompleteOrder(mockVerifyPayload);
      }, 900);
      return;
    }

    try {
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Shaify Styles',
        description: 'Modest Fashion & Curated Hampers',
        image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=200&q=80',
        order_id: orderData.razorpay_order_id,
        handler: (response: any) => {
          this.verifyAndCompleteOrder({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderData.order_id
          });
        },
        prefill: {
          name: this.customerName,
          email: this.customerEmail,
          contact: this.customerPhone
        },
        notes: {
          address: `${this.shippingCity}, ${this.shippingState}`
        },
        theme: {
          color: '#A3485E'
        },
        modal: {
          ondismiss: () => {
            this.isProcessing.set(false);
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.isProcessing.set(false);
        this.errorMessage.set(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (e) {
      console.warn('Razorpay popup open exception, falling back to simulated verification:', e);
      // Fallback
      this.verifyAndCompleteOrder({
        razorpay_order_id: orderData.razorpay_order_id,
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_signature: `sig_demo_${Date.now()}`,
        order_id: orderData.order_id
      });
    }
  }

  private verifyAndCompleteOrder(verifyPayload: any): void {
    this.apiService.verifyPayment(verifyPayload).subscribe({
      next: (verifyRes) => {
        this.isProcessing.set(false);
        if (verifyRes.success && verifyRes.order) {
          // Clear cart, close drawer, and emit confirmation
          this.cartService.clearCart();
          this.cartService.closeCart();
          this.orderConfirmed.emit(verifyRes.order);
        } else {
          this.errorMessage.set(verifyRes.message || 'Payment signature verification failed.');
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.error?.message || 'Verification failed. Please contact support.');
      }
    });
  }
}
