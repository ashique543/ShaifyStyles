import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Component({
  selector: 'app-admin-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts-container">
      @for (t of toasts(); track t.id) {
        <div class="toast-item toast-{{ t.type }}" (click)="dismiss(t.id)">
          <span class="toast-icon">
            @if (t.type === 'success') { ✓ }
            @else if (t.type === 'error') { ✕ }
            @else if (t.type === 'warning') { ⚠ }
            @else { ℹ }
          </span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.8rem 1.2rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      cursor: pointer;
      pointer-events: all;
      animation: slideInRight 0.25s ease-out;
      min-width: 280px;
      max-width: 400px;
    }
    .toast-success { background: #1B5E20; color: #E8F5E9; }
    .toast-error { background: #B71C1C; color: #FFEBEE; }
    .toast-warning { background: #7B3A00; color: #FFF3E0; }
    .toast-info { background: #0D47A1; color: #E3F2FD; }
    .toast-icon { font-size: 1.1rem; flex-shrink: 0; }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class AdminToastsComponent {
  private nextId = 1;
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
