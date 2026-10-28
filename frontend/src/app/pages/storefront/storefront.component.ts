import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product, OrderDetail } from '../../models/product.model';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductDetailsModalComponent } from '../../components/product-details-modal/product-details-modal.component';
import { CartDrawerComponent } from '../../components/cart-drawer/cart-drawer.component';
import { OrderConfirmationModalComponent } from '../../components/order-confirmation-modal/order-confirmation-modal.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import { OrdersModalComponent } from '../../components/orders-modal/orders-modal.component';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    HeroComponent,
    ProductCardComponent,
    ProductDetailsModalComponent,
    CartDrawerComponent,
    OrderConfirmationModalComponent,
    FooterComponent,
    AuthModalComponent,
    OrdersModalComponent
  ],
  templateUrl: './storefront.component.html'
})
export class StorefrontComponent implements OnInit {
  private apiService = inject(ApiService);
  cartService = inject(CartService);

  // Catalog State
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  selectedCategory = signal<string>('All');
  searchQuery = signal<string>('');
  selectedSort = signal<string>('default');

  // Modals State
  selectedProduct = signal<Product | null>(null);
  confirmedOrder = signal<OrderDetail | null>(null);

  categories = [
    { id: 'All', label: 'All Collections', icon: '✨' },
    { id: 'Suits & Kurtis', label: 'Suits & Kurtis', icon: '👗' },
    { id: 'Hijab Bouquets', label: 'Hijab Bouquets', icon: '🌹' },
    { id: 'Custom Hampers', label: 'Custom Hampers', icon: '🎁' }
  ];

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading.set(true);
    const cat = this.selectedCategory();
    const search = this.searchQuery();
    const sort = this.selectedSort();

    this.apiService.getProducts(cat, search, sort).subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.products);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products from API:', err);
        this.isLoading.set(false);
      }
    });
  }

  onCategorySelect(category: string): void {
    this.selectedCategory.set(category);
    this.fetchProducts();
    this.scrollToCatalog();
  }

  onSearchChange(): void {
    this.fetchProducts();
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSort.set(val);
    this.fetchProducts();
  }

  openProductDetails(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
  }

  onOrderConfirmed(order: OrderDetail): void {
    this.confirmedOrder.set(order);
  }

  closeOrderConfirmation(): void {
    this.confirmedOrder.set(null);
  }

  scrollToCatalog(): void {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
