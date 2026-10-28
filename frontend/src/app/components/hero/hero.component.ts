import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero-section">
      <div class="container hero-container">
        <!-- Hero Text & Value Props -->
        <div class="hero-content">
          <div class="hero-pill">
            <span class="pill-sparkle">✨</span>
            <span>Bespoke Modest Boutique</span>
            <span class="pill-handle">&#64;shaifystyles_</span>
          </div>

          <h1 class="hero-title">
            Where Modest Elegance Meets <span class="highlight-serif">Handcrafted Artistry</span>
          </h1>

          <p class="hero-subtitle">
            Curated Pakistani lawn suits, ceremonial farshi ghararas, one-of-a-kind blooming rose hijab bouquets, and personalized gift hampers crafted with affection.
          </p>

          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-icon">🌹</span>
              <span class="feature-text">Handmade Bouquets</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">👗</span>
              <span class="feature-text">Lawn & Farshi Suits</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎁</span>
              <span class="feature-text">Custom Hampers</span>
            </div>
          </div>

          <div class="hero-cta-group">
            <button type="button" class="btn btn-primary hero-btn" (click)="exploreClicked.emit()">
              <span>Explore Collection</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <a 
              href="https://wa.me/919876543210?text=Hi%20Shaify%20Styles!%20I'm%20looking%20to%20order%20a%20custom%20gift%20hamper%20or%20hijab%20bouquet." 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-secondary hero-btn whatsapp-cta">
              <span class="wa-dot"></span>
              <span>WhatsApp Inquiry</span>
            </a>
          </div>

          <!-- Trust Proof -->
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">500+</span>
              <span class="stat-label">Orders Delivered</span>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-item">
              <span class="stat-number">100%</span>
              <span class="stat-label">Handcrafted Care</span>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-item">
              <span class="stat-number">4.9 ★</span>
              <span class="stat-label">Client Reviews</span>
            </div>
          </div>
        </div>

        <!-- Hero Visual Showcase -->
        <div class="hero-visual">
          <div class="hero-image-wrapper">
            <img 
              src="/assets/images/hero_banner.jpg" 
              alt="Shaify Styles Modest Fashion and Handcrafted Hijab Bouquets"
              class="hero-img"
              onerror="this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'"
            />
            <div class="floating-badge top-badge">
              <span class="badge-icon">💖</span>
              <div class="badge-text">
                <strong>Trending Bouquets</strong>
                <span>Folded Silk Hijabs</span>
              </div>
            </div>
            <div class="floating-badge bottom-badge">
              <span class="badge-icon">✨</span>
              <div class="badge-text">
                <strong>Pan-India Delivery</strong>
                <span>Safe & Secure Packaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: radial-gradient(circle at top right, #F9ECEF 0%, #FAF7F2 60%);
      padding: 3.5rem 0 2.5rem;
      border-bottom: 1px solid #E8DFD8;
      overflow: hidden;
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: center;
      gap: 3rem;
    }
    .hero-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      align-self: flex-start;
      background: #F9ECEF;
      color: #A3485E;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 1px solid rgba(163, 72, 94, 0.2);
    }
    .pill-handle {
      color: #C5A059;
      font-weight: 600;
    }
    .hero-title {
      font-size: 3.2rem;
      line-height: 1.15;
      color: #252021;
      letter-spacing: -0.02em;
    }
    .highlight-serif {
      color: #A3485E;
      font-style: italic;
      font-weight: 500;
      position: relative;
    }
    .highlight-serif::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(197, 160, 89, 0.35);
      border-radius: 2px;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: #594F52;
      line-height: 1.6;
      max-width: 580px;
    }
    .hero-features {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin: 0.25rem 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: #FFFFFF;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid #E8DFD8;
      font-size: 0.85rem;
      font-weight: 600;
      color: #252021;
      box-shadow: 0 2px 6px rgba(37, 32, 33, 0.03);
    }
    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .hero-btn {
      padding: 0.95rem 1.8rem;
      font-size: 1rem;
    }
    .whatsapp-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .wa-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #25D366;
      box-shadow: 0 0 8px #25D366;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid #E8DFD8;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-number {
      font-family: var(--font-serif);
      font-size: 1.4rem;
      font-weight: 700;
      color: #252021;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #8E8286;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-separator {
      width: 1px;
      height: 30px;
      background: #E8DFD8;
    }
    .hero-visual {
      position: relative;
    }
    .hero-image-wrapper {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 48px rgba(163, 72, 94, 0.16);
      border: 6px solid #FFFFFF;
      transition: transform 0.4s ease;
    }
    .hero-image-wrapper:hover {
      transform: scale(1.015);
    }
    .hero-img {
      width: 100%;
      height: 480px;
      object-fit: cover;
      display: block;
    }
    .floating-badge {
      position: absolute;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 0.7rem 1.1rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 8px 24px rgba(37, 32, 33, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.8);
      animation: pulseGlow 4s infinite ease-in-out;
    }
    .top-badge {
      top: 20px;
      left: 20px;
    }
    .bottom-badge {
      bottom: 25px;
      right: 20px;
    }
    .badge-icon {
      font-size: 1.4rem;
    }
    .badge-text {
      display: flex;
      flex-direction: column;
    }
    .badge-text strong {
      font-size: 0.85rem;
      color: #252021;
    }
    .badge-text span {
      font-size: 0.75rem;
      color: #8E8286;
    }
    @media (max-width: 992px) {
      .hero-container {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      .hero-title {
        font-size: 2.4rem;
      }
      .hero-img {
        height: 380px;
      }
    }
    @media (max-width: 640px) {
      .hero-title {
        font-size: 1.9rem;
      }
      .floating-badge {
        padding: 0.5rem 0.8rem;
      }
      .hero-img {
        height: 280px;
      }
    }
  `]
})
export class HeroComponent {
  exploreClicked = output<void>();
}
