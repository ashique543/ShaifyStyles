import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-orders-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-modal.component.html'
})
export class OrdersModalComponent implements OnInit {
  authService = inject(CustomerAuthService);
  orders: any[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.authService.getMyOrders().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.orders = res.orders || [];
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  close(): void {
    this.authService.closeOrdersModal();
  }

  onBackdropClick(event: MouseEvent): void {
    this.close();
  }
}
