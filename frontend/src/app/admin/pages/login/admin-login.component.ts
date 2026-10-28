import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  private api = inject(AdminApiService);
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);

  onSubmit(): void {
    if (!this.username.trim() || !this.password) {
      this.errorMsg.set('Please enter both username and password');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.api.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        if (res.success && res.access_token) {
          this.auth.saveSession(res.access_token, res.admin);
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMsg.set(res.message || 'Login failed. Check credentials.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Login failed. Check your credentials.');
        this.isLoading.set(false);
      }
    });
  }
}
