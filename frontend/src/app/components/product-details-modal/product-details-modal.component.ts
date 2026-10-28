import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details-modal.component.html'
})
export class ProductDetailsModalComponent implements OnInit {
  product = input<Product | null>(null);
  close = output<void>();

  private cartService = inject(CartService);

  selectedSize = signal<string>('Standard');
  quantity = signal<number>(1);

  ngOnInit(): void {
    const p = this.product();
    if (p && p.sizes && p.sizes.length > 0) {
      this.selectedSize.set(p.sizes[0]);
    }
  }

  discountPercentage(): number {
    const p = this.product();
    if (!p || !p.discounted_price || p.discounted_price >= p.price) return 0;
    return Math.round(((p.price - p.discounted_price) / p.price) * 100);
  }

  increaseQty(): void {
    const p = this.product();
    if (p && this.quantity() < p.stock) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  onAddToBag(): void {
    const p = this.product();
    if (p) {
      this.cartService.addToCart(p, this.quantity(), this.selectedSize());
      this.close.emit();
    }
  }

  onBuyNow(): void {
    const p = this.product();
    if (p) {
      this.cartService.addToCart(p, this.quantity(), this.selectedSize());
      this.close.emit();
      this.cartService.openCart();
    }
  }

  getWhatsAppInquiryUrl(): string {
    const p = this.product();
    if (!p) return '#';
    const effectivePrice = p.discounted_price ?? p.price;
    const msg = `Hello Shaify Styles (@shaifystyles_)! I'm interested in the *${p.title}* (Size: ${this.selectedSize()}, Price: ₹${effectivePrice}). Can you please share more pictures or customization options?`;
    return `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
  }
}
