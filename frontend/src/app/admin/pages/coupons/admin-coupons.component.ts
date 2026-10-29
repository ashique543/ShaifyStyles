import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminCoupon } from '../../models/admin.models';
import { AdminToastsComponent } from '../../components/admin-toasts.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToastsComponent],
  templateUrl: './admin-coupons.component.html'
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(AdminApiService);
  toasts = viewChild<AdminToastsComponent>('toasts');

  coupons = signal<AdminCoupon[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  isModalOpen = signal(false);
  editingCoupon = signal<AdminCoupon | null>(null);
  deletingCoupon = signal<AdminCoupon | null>(null);
  formError = signal<string | null>(null);

  form: Partial<AdminCoupon> = this.resetForm();

  ngOnInit(): void {
    this.loadCoupons();
  }

  resetForm(): Partial<AdminCoupon> {
    return {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 999,
      max_uses: null,
      is_active: true
    };
  }

  loadCoupons(): void {
    this.isLoading.set(true);
    this.api.getCoupons().subscribe({
      next: (res) => {
        if (res.success) {
          this.coupons.set(res.coupons || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toasts()?.show('Failed to load coupons', 'error');
      }
    });
  }

  openCreateModal(): void {
    this.editingCoupon.set(null);
    this.form = this.resetForm();
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(cpn: AdminCoupon): void {
    this.editingCoupon.set(cpn);
    this.form = { ...cpn };
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCoupon.set(null);
    this.formError.set(null);
  }

  onCodeInput(): void {
    if (this.form.code) {
      this.form.code = this.form.code.toUpperCase().replace(/\s+/g, '');
    }
  }

  saveCoupon(): void {
    if (!this.form.code?.trim()) {
      this.formError.set('Coupon code is required.');
      return;
    }
    if (this.form.discount_value === undefined || this.form.discount_value <= 0) {
      this.formError.set('Discount value must be greater than 0.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const isEdit = !!this.editingCoupon();
    const obs$ = isEdit
      ? this.api.updateCoupon(this.editingCoupon()!.id, this.form)
      : this.api.createCoupon(this.form);

    obs$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.toasts()?.show(isEdit ? 'Coupon updated!' : 'Coupon created!', 'success');
          this.closeModal();
          this.loadCoupons();
        } else {
          this.formError.set(res.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.formError.set(err.error?.message || 'Server error occurred');
      }
    });
  }

  confirmDelete(cpn: AdminCoupon): void {
    this.deletingCoupon.set(cpn);
  }

  cancelDelete(): void {
    this.deletingCoupon.set(null);
  }

  executeDelete(): void {
    const cpn = this.deletingCoupon();
    if (!cpn) return;

    this.api.deleteCoupon(cpn.id).subscribe({
      next: (res) => {
        this.deletingCoupon.set(null);
        if (res.success) {
          this.toasts()?.show(`Coupon "${cpn.code}" deleted.`, 'success');
          this.loadCoupons();
        } else {
          this.toasts()?.show(res.message || 'Could not delete coupon', 'error');
        }
      },
      error: (err) => {
        this.deletingCoupon.set(null);
        this.toasts()?.show(err.error?.message || 'Delete request failed', 'error');
      }
    });
  }

  toggleActive(cpn: AdminCoupon): void {
    this.api.updateCoupon(cpn.id, { is_active: !cpn.is_active }).subscribe({
      next: () => {
        this.toasts()?.show(`Coupon "${cpn.code}" is now ${!cpn.is_active ? 'active' : 'paused'}`, 'success');
        this.loadCoupons();
      },
      error: () => this.toasts()?.show('Status update failed', 'error')
    });
  }
}
