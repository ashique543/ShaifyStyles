import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="product-card" (click)="viewDetails.emit(product())">
      <!-- Media Container -->
      <div class="card-media">
        <img 
          [src]="product().image_url" 
          [alt]="product().title"
          class="product-image"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'"
        />

        <!-- Badges Overlay -->
        <div class="card-badges">
          @if (product().badge) {
            <span class="badge badge-rose">{{ product().badge }}</span>
          }
          @if (discountPercentage() > 0) {
            <span class="badge badge-gold">{{ discountPercentage() }}% OFF</span>
          }
        </div>

        <!-- Quick View Overlay Button -->
        <div class="media-hover-overlay">
          <button type="button" class="btn btn-secondary quick-view-btn">
            <span>Quick View</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="card-body">
        <div class="card-meta">
          <span class="category-tag">{{ product().category }}</span>
          @if (product().stock <= 5 && product().stock > 0) {
            <span class="stock-warning">Only {{ product().stock }} left</span>
          }
        </div>

        <h3 class="product-title" [title]="product().title">{{ product().title }}</h3>

        @if (product().fabric) {
          <p class="product-fabric">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
              <line x1="16" y1="8" x2="2" y2="22"></line>
              <line x1="17.5" y1="15" x2="9" y2="15"></line>
            </svg>
            {{ product().fabric }}
          </p>
        }

        <!-- Price Section -->
        <div class="price-row">
          <div class="price-group">
            <span class="current-price">₹{{ (product().discounted_price ?? product().price) | number:'1.0-0' }}</span>
            @if (product().discounted_price) {
              <span class="original-price">₹{{ product().price | number:'1.0-0' }}</span>
            }
          </div>
          <span class="sizes-hint">{{ product().sizes.length }} sizes</span>
        </div>

        <!-- Action Row -->
        <div class="card-actions" (click)="$event.stopPropagation()">
          <button 
            type="button" 
            class="btn btn-primary add-cart-btn"
            [disabled]="product().stock <= 0"
            (click)="onQuickAdd()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>{{ product().stock > 0 ? 'Add to Bag' : 'Sold Out' }}</span>
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .product-card {
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E8DFD8;
      box-shadow: 0 4px 14px rgba(37, 32, 33, 0.04);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;
    }
    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 32px rgba(163, 72, 94, 0.12);
      border-color: #C5A059;
    }
    .card-media {
      position: relative;
      width: 100%;
      height: 290px;
      overflow: hidden;
      background: #FAF7F2;
    }
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-card:hover .product-image {
      transform: scale(1.08);
    }
    .card-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      z-index: 2;
    }
    .media-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(37, 32, 33, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      z-index: 3;
    }
    .product-card:hover .media-hover-overlay {
      opacity: 1;
    }
    .quick-view-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.85rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }
    .category-tag {
      font-size: 0.75rem;
      color: #873649;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .stock-warning {
      font-size: 0.72rem;
      color: #D32F2F;
      font-weight: 600;
    }
    .product-title {
      font-size: 1.15rem;
      line-height: 1.35;
      color: #252021;
      margin-bottom: 0.35rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7rem;
    }
    .product-fabric {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: #8E8286;
      margin-bottom: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: auto;
      margin-bottom: 1rem;
    }
    .price-group {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .current-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #252021;
      font-family: var(--font-serif);
    }
    .original-price {
      font-size: 0.9rem;
      color: #8E8286;
      text-decoration: line-through;
    }
    .sizes-hint {
      font-size: 0.75rem;
      color: #594F52;
      background: #F4EFE6;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    .add-cart-btn {
      width: 100%;
      padding: 0.65rem 1rem;
      font-size: 0.85rem;
    }
  `]
})
export class ProductCardComponent {
  product = input.required<Product>();
  viewDetails = output<Product>();

  private cartService = inject(CartService);

  discountPercentage(): number {
    const p = this.product();
    if (!p.discounted_price || p.discounted_price >= p.price) return 0;
    return Math.round(((p.price - p.discounted_price) / p.price) * 100);
  }

  onQuickAdd(): void {
    const p = this.product();
    const defaultSize = p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'Standard';
    this.cartService.addToCart(p, 1, defaultSize);
  }
}
