import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';
import { DashboardMetrics, AdminOrder } from '../../models/admin.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(AdminApiService);

  isLoading = signal(true);
  metrics = signal<DashboardMetrics | null>(null);
  recentOrders = signal<AdminOrder[]>([]);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this.api.getMetrics().subscribe({
      next: (res) => {
        if (res.success) {
          this.metrics.set(res.metrics);
          this.recentOrders.set(res.recent_orders || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getStatusEntries(): [string, number][] {
    const m = this.metrics();
    if (!m?.orders_by_status) return [];
    return Object.entries(m.orders_by_status);
  }
}
