import { Component, inject, output, input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  cartService = inject(CartService);
  authService = inject(CustomerAuthService);
  selectedCategory = input<string>('All');
  categoryChange = output<string>();

  isUserMenuOpen = false;

  onSelectCategory(cat: string): void {
    this.categoryChange.emit(cat);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openAuthModal(): void {
    this.isUserMenuOpen = false;
    this.authService.openAuthModal();
  }

  openOrdersModal(): void {
    this.isUserMenuOpen = false;
    this.authService.openOrdersModal();
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
  }

  getUserFirstName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Account';
    return user.name.split(' ')[0];
  }

  getUserInitial(): string {
    const user = this.authService.currentUser();
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-menu-wrap')) {
      this.isUserMenuOpen = false;
    }
  }
}

