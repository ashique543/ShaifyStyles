import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html'
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
