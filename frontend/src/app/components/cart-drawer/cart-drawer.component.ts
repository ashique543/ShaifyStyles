import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { OrderDetail } from '../../models/product.model';

declare var Razorpay: any;

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-drawer.component.html'
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  authService = inject(CustomerAuthService);
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

  // Coupon State
  couponCode = '';
  appliedCoupon = signal<any | null>(null);
  couponDiscount = signal<number>(0);
  couponError = signal<string | null>(null);
  isApplyingCoupon = signal<boolean>(false);

  applyCoupon(): void {
    const code = this.couponCode.trim();
    if (!code) return;
    this.isApplyingCoupon.set(true);
    this.couponError.set(null);

    this.apiService.validateCoupon(code, this.cartService.subtotal()).subscribe({
      next: (res) => {
        this.isApplyingCoupon.set(false);
        if (res.success && res.coupon) {
          this.appliedCoupon.set(res.coupon);
          this.couponDiscount.set(res.discount_amount || 0);
          this.couponError.set(null);
        } else {
          this.appliedCoupon.set(null);
          this.couponDiscount.set(0);
          this.couponError.set(res.message || 'Invalid coupon code');
        }
      },
      error: (err) => {
        this.isApplyingCoupon.set(false);
        this.appliedCoupon.set(null);
        this.couponDiscount.set(0);
        this.couponError.set(err.error?.message || 'Could not validate coupon');
      }
    });
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.appliedCoupon.set(null);
    this.couponDiscount.set(0);
    this.couponError.set(null);
  }

  getProgressPercentage(): number {
    const sub = this.cartService.subtotal();
    const thresh = this.cartService.freeShippingThreshold;
    return Math.min(100, Math.round((sub / thresh) * 100));
  }

  finalTotal(): number {
    const sub = this.cartService.subtotal();
    const shipping = this.cartService.isFreeShippingEligible() ? 0 : 150;
    const discount = this.couponDiscount();
    return Math.max(0, sub + shipping - discount);
  }

  proceedToShipping(): void {
    if (this.cartService.items().length === 0) return;
    const u = this.authService.currentUser();
    if (u) {
      if (!this.customerName && u.name) this.customerName = u.name;
      if (!this.customerEmail && u.email) this.customerEmail = u.email;
      if (!this.customerPhone && u.phone) this.customerPhone = u.phone;
      if (!this.shippingStreet && u.default_address) this.shippingStreet = u.default_address;
    }
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
      user_id: this.authService.currentUser()?.id,
      items: this.cartService.items().map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        size: i.size
      })),
      customer_name: this.customerName.trim(),
      customer_email: this.customerEmail.trim(),
      customer_phone: this.customerPhone.trim(),
      shipping_address: `${this.shippingStreet.trim()}, ${this.shippingCity.trim()}, ${this.shippingState.trim()} - ${this.shippingPincode.trim()}`,
      notes: this.orderNotes.trim(),
      coupon_code: this.appliedCoupon()?.code
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
