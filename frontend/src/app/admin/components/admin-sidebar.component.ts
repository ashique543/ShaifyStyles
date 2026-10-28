import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html'
})
export class AdminSidebarComponent {
  auth = inject(AdminAuthService);
  collapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  firstLetter(): string {
    return (this.auth.currentAdmin()?.username?.[0] ?? 'A').toUpperCase();
  }

  onLogout(): void {
    this.auth.logout();
  }
}
