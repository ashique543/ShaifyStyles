import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="admin-layout-shell">
      <app-admin-sidebar 
        [collapsed]="sidebarCollapsed()" 
        (toggleCollapse)="toggleSidebar()">
      </app-admin-sidebar>

      <main class="admin-main-viewport">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #10090c;
    }
    .admin-layout-shell {
      display: flex;
      min-height: 100vh;
      background: #10090c;
      color: #FAF7F2;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    .admin-main-viewport {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      max-height: 100vh;
      background: #10090c;
    }
  `]
})
export class AdminLayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
