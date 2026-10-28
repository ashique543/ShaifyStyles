import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (product()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <!-- Close Button -->
          <button type="button" class="close-modal-btn" (click)="close.emit()" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div class="modal-grid">
            <!-- Left: Product Image Gallery -->
            <div class="product-gallery">
              <div class="image-frame">
                <img 
                  [src]="product()!.image_url" 
                  [alt]="product()!.title" 
                  class="featured-image"
                  onerror="this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'"
                />
                @if (product()!.badge) {
                  <span class="badge badge-rose gallery-badge">{{ product()!.badge }}</span>
                }
              </div>
              <div class="gallery-perks">
                <div class="perk-item">
                  <span class="perk-icon">✨</span>
                  <span>Handcrafted with Care</span>
                </div>
                <div class="perk-item">
                  <span class="perk-icon">🚚</span>
                  <span>Pan India Delivery</span>
                </div>
                <div class="perk-item">
                  <span class="perk-icon">🎁</span>
                  <span>Gift Wrapped</span>
                </div>
              </div>
            </div>

            <!-- Right: Product Information & Purchase Controls -->
            <div class="product-info-panel">
              <div class="info-header">
                <span class="category-pill">{{ product()!.category }}</span>
                <span class="brand-handle">&#64;shaifystyles_</span>
              </div>

              <h2 class="detail-title">{{ product()!.title }}</h2>

              <!-- Price Box -->
              <div class="detail-price-box">
                <span class="current-price">₹{{ (product()!.discounted_price ?? product()!.price) | number:'1.0-0' }}</span>
                @if (product()!.discounted_price) {
                  <span class="original-price">₹{{ product()!.price | number:'1.0-0' }}</span>
                  <span class="badge badge-gold">{{ discountPercentage() }}% OFF</span>
                }
                <span class="tax-note">Inclusive of all taxes</span>
              </div>

              @if (product()!.fabric) {
                <div class="fabric-badge-row">
                  <span class="fabric-label">Material / Fabric:</span>
                  <span class="fabric-value">{{ product()!.fabric }}</span>
                </div>
              }

              <!-- Description -->
              <p class="detail-description">{{ product()!.description }}</p>

              <!-- Size Selector -->
              @if (product()!.sizes && product()!.sizes.length > 0) {
                <div class="size-selection-area">
                  <div class="size-header">
                    <span class="label">Select Size / Style:</span>
                    <span class="selected-size-label">{{ selectedSize() }}</span>
                  </div>
                  <div class="size-pills">
                    @for (s of product()!.sizes; track s) {
                      <button 
                        type="button" 
                        class="size-pill-btn" 
                        [class.active]="selectedSize() === s"
                        (click)="selectedSize.set(s)">
                        {{ s }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Quantity Selector -->
              <div class="quantity-selection-area">
                <span class="label">Quantity:</span>
                <div class="qty-stepper">
                  <button type="button" class="stepper-btn" (click)="decreaseQty()" [disabled]="quantity() <= 1">-</button>
                  <span class="qty-display">{{ quantity() }}</span>
                  <button type="button" class="stepper-btn" (click)="increaseQty()" [disabled]="quantity() >= product()!.stock">+</button>
                </div>
                <span class="stock-status" [class.low-stock]="product()!.stock < 5">
                  @if (product()!.stock > 5) {
                    ✓ In Stock (Dispatches in 24-48 hrs)
                  } @else if (product()!.stock > 0) {
                    ⚠️ Hurry, only {{ product()!.stock }} left in stock!
                  } @else {
                    ✕ Out of stock
                  }
                </span>
              </div>

              <!-- Main Action Buttons -->
              <div class="action-buttons-group">
                <button 
                  type="button" 
                  class="btn btn-primary btn-add-bag"
                  [disabled]="product()!.stock <= 0"
                  (click)="onAddToBag()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span>Add to Bag</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-gold btn-buy-now"
                  [disabled]="product()!.stock <= 0"
                  (click)="onBuyNow()">
                  <span>Buy Now</span>
                </button>
              </div>

              <!-- WhatsApp Direct Inquiry -->
              <a 
                [href]="getWhatsAppInquiryUrl()" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-whatsapp btn-inquire-wa">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                </svg>
                <span>Inquire on WhatsApp with &#64;shaifystyles_</span>
              </a>

              <!-- Accordion Notes -->
              <div class="product-accordion">
                <details class="accordion-item" open>
                  <summary class="accordion-summary">Packaging & Customization Details</summary>
                  <div class="accordion-content">
                    <p>Every order is individually packaged in our signature floral tissue and satin ribbons. For custom bouquets & gift hampers, you can add personalized greeting cards and color choices during checkout!</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-dialog {
      background: #FAF7F2;
      border-radius: 24px;
      max-width: 960px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      border: 1px solid #E8DFD8;
      box-shadow: 0 25px 60px rgba(37, 32, 33, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .close-modal-btn {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 38px;
      height: 38px;
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #252021;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
    }
    .close-modal-btn:hover {
      background: #F9ECEF;
      color: #A3485E;
      transform: rotate(90deg);
    }
    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 2rem;
      padding: 2.25rem;
    }
    .product-gallery {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .image-frame {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      height: 440px;
      box-shadow: 0 8px 24px rgba(37, 32, 33, 0.06);
    }
    .featured-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .gallery-badge {
      position: absolute;
      top: 14px;
      left: 14px;
    }
    .gallery-perks {
      display: flex;
      justify-content: space-between;
      background: #FFFFFF;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid #E8DFD8;
      font-size: 0.75rem;
      color: #594F52;
    }
    .perk-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
    }
    .product-info-panel {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .info-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .category-pill {
      font-size: 0.75rem;
      font-weight: 700;
      color: #A3485E;
      background: #F9ECEF;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .brand-handle {
      font-size: 0.8rem;
      color: #C5A059;
      font-weight: 600;
    }
    .detail-title {
      font-size: 1.75rem;
      line-height: 1.25;
      color: #252021;
    }
    .detail-price-box {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #E8DFD8;
    }
    .detail-price-box .current-price {
      font-family: var(--font-serif);
      font-size: 1.8rem;
      font-weight: 700;
      color: #252021;
    }
    .detail-price-box .original-price {
      font-size: 1.1rem;
      color: #8E8286;
      text-decoration: line-through;
    }
    .tax-note {
      font-size: 0.75rem;
      color: #8E8286;
      margin-left: auto;
    }
    .fabric-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .fabric-label {
      color: #8E8286;
    }
    .fabric-value {
      color: #252021;
      font-weight: 600;
    }
    .detail-description {
      font-size: 0.95rem;
      color: #594F52;
      line-height: 1.6;
    }
    .size-selection-area {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .size-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .size-header .label {
      font-weight: 700;
      color: #252021;
    }
    .selected-size-label {
      color: #A3485E;
      font-weight: 600;
    }
    .size-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .size-pill-btn {
      padding: 0.45rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid #E8DFD8;
      background: #FFFFFF;
      color: #252021;
      cursor: pointer;
      transition: all 0.2s;
    }
    .size-pill-btn:hover {
      border-color: #A3485E;
      color: #A3485E;
    }
    .size-pill-btn.active {
      background: #A3485E;
      color: #FFFFFF;
      border-color: #A3485E;
      box-shadow: 0 4px 12px rgba(163, 72, 94, 0.25);
    }
    .quantity-selection-area {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .quantity-selection-area .label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #252021;
    }
    .qty-stepper {
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid #E8DFD8;
      border-radius: 8px;
      overflow: hidden;
    }
    .stepper-btn {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: #252021;
      background: #F4EFE6;
      cursor: pointer;
      transition: background 0.15s;
    }
    .stepper-btn:hover:not(:disabled) {
      background: #E8DFD8;
    }
    .stepper-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .qty-display {
      width: 40px;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .stock-status {
      font-size: 0.8rem;
      font-weight: 600;
      color: #2E7D32;
    }
    .stock-status.low-stock {
      color: #D32F2F;
    }
    .action-buttons-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-add-bag, .btn-buy-now, .btn-inquire-wa {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }
    .btn-inquire-wa {
      width: 100%;
      gap: 0.5rem;
      border-radius: var(--radius-full);
    }
    .product-accordion {
      margin-top: 0.5rem;
      border-top: 1px solid #E8DFD8;
      padding-top: 0.5rem;
    }
    .accordion-summary {
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      color: #252021;
      padding: 0.5rem 0;
    }
    .accordion-content {
      padding: 0.5rem 0;
      font-size: 0.85rem;
      color: #594F52;
      line-height: 1.5;
    }
    @media (max-width: 820px) {
      .modal-grid {
        grid-template-columns: 1fr;
        padding: 1.5rem;
      }
      .image-frame {
        height: 320px;
      }
      .action-buttons-group {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductDetailsModalComponent {
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
