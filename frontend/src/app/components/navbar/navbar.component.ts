import { Component, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  cartService = inject(CartService);
  selectedCategory = input<string>('All');
  categoryChange = output<string>();

  onSelectCategory(cat: string): void {
    this.categoryChange.emit(cat);
  }
}
