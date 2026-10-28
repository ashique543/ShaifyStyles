import { Injectable, signal, computed } from '@angular/core';
import { Product, CartItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'shaify_styles_cart';
  
  // Reactive Signals
  readonly items = signal<CartItem[]>(this.loadCartFromStorage());
  readonly isCartOpen = signal<boolean>(false);
  readonly lastNotification = signal<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Computed signals
  readonly totalCount = computed(() => {
    return this.items().reduce((acc, item) => acc + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    return this.items().reduce((acc, item) => {
      const price = item.product.discounted_price ?? item.product.price;
      return acc + (price * item.quantity);
    }, 0);
  });

  readonly freeShippingThreshold = 2999;

  readonly amountForFreeShipping = computed(() => {
    const remaining = this.freeShippingThreshold - this.subtotal();
    return remaining > 0 ? remaining : 0;
  });

  readonly isFreeShippingEligible = computed(() => {
    return this.subtotal() >= this.freeShippingThreshold;
  });

  private loadCartFromStorage(): CartItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not load cart from storage', e);
      return [];
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    } catch (e) {
      console.warn('Could not save cart to storage', e);
    }
  }

  openCart(): void {
    this.isCartOpen.set(true);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  toggleCart(): void {
    this.isCartOpen.update(open => !open);
  }

  addToCart(product: Product, quantity = 1, size = 'Standard'): void {
    const current = [...this.items()];
    const existingIndex = current.findIndex(
      item => item.product.id === product.id && item.size === size
    );

    if (existingIndex > -1) {
      current[existingIndex].quantity += quantity;
    } else {
      current.push({ product, quantity, size });
    }

    this.items.set(current);
    this.saveCartToStorage();
    this.showNotification(`Added "${product.title}" (${size}) to bag!`, 'success');
  }

  updateQuantity(index: number, quantity: number): void {
    const current = [...this.items()];
    if (index >= 0 && index < current.length) {
      if (quantity <= 0) {
        current.splice(index, 1);
      } else {
        current[index].quantity = quantity;
      }
      this.items.set(current);
      this.saveCartToStorage();
    }
  }

  removeItem(index: number): void {
    const current = [...this.items()];
    if (index >= 0 && index < current.length) {
      const removed = current.splice(index, 1);
      this.items.set(current);
      this.saveCartToStorage();
      if (removed.length > 0) {
        this.showNotification(`Removed "${removed[0].product.title}" from bag`, 'info');
      }
    }
  }

  clearCart(): void {
    this.items.set([]);
    this.saveCartToStorage();
  }

  showNotification(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
    this.lastNotification.set({ message, type });
    setTimeout(() => {
      this.lastNotification.set(null);
    }, 3500);
  }
}
