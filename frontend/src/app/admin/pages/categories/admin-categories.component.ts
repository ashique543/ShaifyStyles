import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminCategory } from '../../models/admin.models';
import { AdminToastsComponent } from '../../components/admin-toasts.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToastsComponent],
  templateUrl: './admin-categories.component.html'
})
export class AdminCategoriesComponent implements OnInit {
  private api = inject(AdminApiService);
  toasts = viewChild<AdminToastsComponent>('toasts');

  categories = signal<AdminCategory[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  isModalOpen = signal(false);
  editingCategory = signal<AdminCategory | null>(null);
  deletingCategory = signal<AdminCategory | null>(null);
  formError = signal<string | null>(null);

  form: Partial<AdminCategory> = this.resetForm();

  emojiOptions = ['👗', '🌹', '🎁', '✨', '👑', '💎', '🌸', '🧕', '🧣', '🎀', '🛍️', '📦'];

  ngOnInit(): void {
    this.loadCategories();
  }

  resetForm(): Partial<AdminCategory> {
    return {
      name: '',
      slug: '',
      description: '',
      icon: '👗',
      sort_order: 0,
      is_active: true
    };
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.api.getCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.categories || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toasts()?.show('Failed to load categories', 'error');
      }
    });
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.form = this.resetForm();
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(cat: AdminCategory): void {
    this.editingCategory.set(cat);
    this.form = { ...cat };
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCategory.set(null);
    this.formError.set(null);
  }

  onNameChange(): void {
    if (!this.editingCategory() && this.form.name) {
      this.form.slug = this.form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  saveCategory(): void {
    if (!this.form.name?.trim()) {
      this.formError.set('Category name is required.');
      return;
    }
    if (!this.form.slug?.trim()) {
      this.formError.set('Category slug is required.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const isEdit = !!this.editingCategory();
    const obs$ = isEdit
      ? this.api.updateCategory(this.editingCategory()!.id, this.form)
      : this.api.createCategory(this.form);

    obs$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.toasts()?.show(isEdit ? 'Category updated!' : 'Category created!', 'success');
          this.closeModal();
          this.loadCategories();
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

  confirmDelete(cat: AdminCategory): void {
    this.deletingCategory.set(cat);
  }

  cancelDelete(): void {
    this.deletingCategory.set(null);
  }

  executeDelete(): void {
    const cat = this.deletingCategory();
    if (!cat) return;

    this.api.deleteCategory(cat.id).subscribe({
      next: (res) => {
        this.deletingCategory.set(null);
        if (res.success) {
          this.toasts()?.show(`Category "${cat.name}" deleted.`, 'success');
          this.loadCategories();
        } else {
          this.toasts()?.show(res.message || 'Could not delete category', 'error');
        }
      },
      error: (err) => {
        this.deletingCategory.set(null);
        this.toasts()?.show(err.error?.message || 'Delete request failed', 'error');
      }
    });
  }

  toggleActive(cat: AdminCategory): void {
    this.api.updateCategory(cat.id, { is_active: !cat.is_active }).subscribe({
      next: () => {
        this.toasts()?.show(`Category "${cat.name}" is now ${!cat.is_active ? 'active' : 'hidden'}`, 'success');
        this.loadCategories();
      },
      error: () => this.toasts()?.show('Status update failed', 'error')
    });
  }
}
