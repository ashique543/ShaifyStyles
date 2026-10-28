import { Component, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Announcement Banner -->
    <div class="announcement-bar">
      <div class="announcement-content">
        <span class="delivery-highlight">
          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          Pan India Delivery
        </span>
        <span class="divider">•</span>
        <span class="trust-badge">
          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          500+ Orders Delivered
        </span>
        <span class="divider">•</span>
        <span class="custom-badge">Custom Hampers Available</span>
      </div>
      <div class="announcement-actions">
        <a href="https://instagram.com/shaifystyles_" target="_blank" rel="noopener noreferrer" class="social-link" title="Follow on Instagram">
          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span>&#64;shaifystyles_</span>
        </a>
        <a href="https://wa.me/919876543210?text=Hello%20Shaify%20Styles!%20I%20would%20like%20to%20inquire%20about%20custom%20hampers." target="_blank" rel="noopener noreferrer" class="social-link whatsapp-pill">
          <span>WhatsApp Inquiry</span>
        </a>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <header class="main-header">
      <div class="container header-container">
        <!-- Brand Logo -->
        <a href="#" class="brand-logo" (click)="onSelectCategory('All'); $event.preventDefault()">
          <div class="brand-mark">SS</div>
          <div class="brand-text">
            <span class="brand-title">Shaify Styles</span>
            <span class="brand-tagline">Modest Fashion & Curated Hampers</span>
          </div>
        </a>

        <!-- Navigation Links -->
        <nav class="nav-links">
          <button 
            type="button"
            class="nav-btn" 
            [class.active]="selectedCategory() === 'All'"
            (click)="onSelectCategory('All')">
            All Collections
          </button>
          <button 
            type="button"
            class="nav-btn" 
            [class.active]="selectedCategory() === 'Suits & Kurtis'"
            (click)="onSelectCategory('Suits & Kurtis')">
            Suits & Kurtis
          </button>
          <button 
            type="button"
            class="nav-btn" 
            [class.active]="selectedCategory() === 'Hijab Bouquets'"
            (click)="onSelectCategory('Hijab Bouquets')">
            Hijab Bouquets
          </button>
          <button 
            type="button"
            class="nav-btn" 
            [class.active]="selectedCategory() === 'Custom Hampers'"
            (click)="onSelectCategory('Custom Hampers')">
            Custom Hampers
          </button>
        </nav>

        <!-- Header Actions: Cart & Contact -->
        <div class="header-actions">
          <button 
            type="button" 
            class="cart-toggle-btn" 
            (click)="cartService.openCart()"
            aria-label="View Shopping Bag">
            <svg class="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span class="cart-label">Bag</span>
            @if (cartService.totalCount() > 0) {
              <span class="cart-badge">{{ cartService.totalCount() }}</span>
            }
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .announcement-bar {
      background: linear-gradient(90deg, #873649, #A3485E, #873649);
      color: #FFFFFF;
      font-size: 0.8rem;
      padding: 0.45rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      letter-spacing: 0.03em;
    }
    .announcement-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    .divider {
      opacity: 0.6;
    }
    .icon-inline {
      width: 14px;
      height: 14px;
      vertical-align: -2px;
      display: inline-block;
      margin-right: 0.25rem;
    }
    .announcement-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: #FAF7F2;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .social-link:hover {
      opacity: 0.85;
      text-decoration: underline;
    }
    .whatsapp-pill {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.15rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }
    .whatsapp-pill:hover {
      background: rgba(255, 255, 255, 0.35);
      text-decoration: none;
    }
    .main-header {
      background: rgba(253, 251, 248, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid #E8DFD8;
      position: sticky;
      top: 0;
      z-index: 100;
      transition: box-shadow 0.3s;
    }
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 78px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
    }
    .brand-mark {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #A3485E, #C5A059);
      color: #FFFFFF;
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(163, 72, 94, 0.25);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-family: var(--font-serif);
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #252021;
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #873649;
      font-weight: 600;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-btn {
      padding: 0.55rem 1rem;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #594F52;
      transition: all 0.2s ease;
      background: transparent;
    }
    .nav-btn:hover {
      color: #A3485E;
      background: #F9ECEF;
    }
    .nav-btn.active {
      color: #A3485E;
      background: #F9ECEF;
      box-shadow: 0 2px 8px rgba(163, 72, 94, 0.12);
    }
    .cart-toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      background: #252021;
      color: #FFFFFF;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s ease;
      position: relative;
    }
    .cart-toggle-btn:hover {
      background: #A3485E;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(163, 72, 94, 0.3);
    }
    .cart-icon {
      width: 18px;
      height: 18px;
    }
    .cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #C5A059;
      color: #252021;
      font-size: 0.75rem;
      font-weight: 800;
      min-width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      animation: pulseGlow 2s infinite ease-in-out;
    }
    @media (max-width: 900px) {
      .announcement-bar {
        justify-content: center;
        text-align: center;
      }
      .announcement-actions {
        display: none;
      }
      .nav-links {
        display: none;
      }
      .brand-title {
        font-size: 1.3rem;
      }
      .brand-tagline {
        font-size: 0.65rem;
      }
    }
  `]
})
export class NavbarComponent {
  cartService = inject(CartService);
  selectedCategory = input<string>('All');
  categoryChange = output<string>();

  onSelectCategory(cat: string): void {
    this.categoryChange.emit(cat);
  }
}
