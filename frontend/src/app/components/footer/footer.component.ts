import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="boutique-footer">
      <div class="container footer-container">
        <!-- Col 1: Brand Info -->
        <div class="footer-col brand-col">
          <div class="brand-row">
            <div class="brand-mark-sm">SS</div>
            <span class="brand-name">Shaify Styles</span>
          </div>
          <p class="brand-bio">
            An artisanal modest fashion and gifting boutique. Specializing in luxury Pakistani lawn suits, farshi ghararas, handcrafted rose hijab bouquets, and bespoke celebratory hampers.
          </p>
          <div class="social-tags">
            <a href="https://instagram.com/shaifystyles_" target="_blank" rel="noopener noreferrer" class="social-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>&#64;shaifystyles_ on Instagram</span>
            </a>
          </div>
        </div>

        <!-- Col 2: Collections -->
        <div class="footer-col">
          <h4 class="col-title">Collections</h4>
          <ul class="footer-links">
            <li><a href="#catalog">Lawn & Farshi Suits</a></li>
            <li><a href="#catalog">Cotton & Daily Kurtis</a></li>
            <li><a href="#catalog">Handmade Hijab Bouquets</a></li>
            <li><a href="#catalog">Bespoke Bridal Hampers</a></li>
            <li><a href="#catalog">Eid & Festive Gift Trunks</a></li>
          </ul>
        </div>

        <!-- Col 3: Customer Care & Policies -->
        <div class="footer-col">
          <h4 class="col-title">Customer Care</h4>
          <ul class="footer-links">
            <li><span>🚚 Pan-India Insured Delivery (3-5 Days)</span></li>
            <li><span>💳 Razorpay 100% Encrypted Checkout</span></li>
            <li><span>🎀 Complimentary Satin Gift Packaging</span></li>
            <li><span>✨ Handcrafted & Inspected with Love</span></li>
          </ul>
        </div>

        <!-- Col 4: Bespoke Orders -->
        <div class="footer-col">
          <h4 class="col-title">Custom Inquiries</h4>
          <p class="custom-desc">
            Need custom colors, personalized ribbons, or bulk wedding hampers? Chat with our stylist directly on WhatsApp.
          </p>
          <a 
            href="https://wa.me/919876543210?text=Hello%20Shaify%20Styles!%20I'm%20inquiring%20about%20a%20custom%20order." 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-whatsapp wa-footer-btn">
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-container">
          <p>© 2025 Shaify Styles (@shaifystyles_). All rights reserved. Made with love for modest fashion lovers.</p>
          <div class="payment-icons-text">
            <span>Razorpay • UPI • Cards • NetBanking</span>
            <span class="dot-sep">•</span>
            <a routerLink="/admin/login" class="admin-portal-link" title="Shaify Styles Admin Portal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Admin Portal</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .boutique-footer {
      background: #252021;
      color: #FAF7F2;
      padding-top: 4rem;
      border-top: 2px solid #C5A059;
      margin-top: 4rem;
    }
    .footer-container {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1.25fr 1.25fr;
      gap: 3rem;
      padding-bottom: 3rem;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1rem;
    }
    .brand-mark-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #A3485E, #C5A059);
      color: #FFFFFF;
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-family: var(--font-serif);
      font-size: 1.4rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .brand-bio {
      font-size: 0.85rem;
      color: #C0B7B9;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .social-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      color: #FAF7F2;
      font-size: 0.8rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    .social-badge:hover {
      background: rgba(163, 72, 94, 0.4);
    }
    .col-title {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      color: #DFC07F;
      margin-bottom: 1.25rem;
      font-weight: 600;
    }
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #C0B7B9;
    }
    .footer-links a:hover {
      color: #DFC07F;
    }
    .custom-desc {
      font-size: 0.85rem;
      color: #C0B7B9;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .wa-footer-btn {
      padding: 0.6rem 1.25rem;
      font-size: 0.85rem;
      border-radius: 9999px;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem 0;
      font-size: 0.8rem;
      color: #8E8286;
    }
    .bottom-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dot-sep {
      opacity: 0.4;
      margin: 0 0.25rem;
    }
    .admin-portal-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #8E8286;
      text-decoration: none;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .admin-portal-link:hover {
      color: #C5A059;
    }
    @media (max-width: 900px) {
      .footer-container {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
    }
    @media (max-width: 600px) {
      .footer-container {
        grid-template-columns: 1fr;
      }
      .bottom-container {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {}
