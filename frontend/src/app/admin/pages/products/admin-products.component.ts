import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminProduct } from '../../models/admin.models';
import { AdminToastsComponent } from '../../components/admin-toasts.component';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Standard',
  'Standard (2 Hijabs)', 'Standard (3 Hijabs)', 'Deluxe (5 Hijabs)', 'Luxury (6 Hijabs)',
  'Curated Gift Box', 'Luxury Velvet Trunk (+Rs.600)', 'Standard Box', 'Premium Keepsake Box', 'Luxury Gift Box'];

const CATEGORIES = ['Suits & Kurtis', 'Hijab Bouquets', 'Custom Hampers'];

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToastsComponent],
  templateUrl: './admin-products.component.html'
})
export class AdminProductsComponent implements OnInit {
  private api = inject(AdminApiService);
  toasts = viewChild<AdminToastsComponent>('toasts');

  products = signal<AdminProduct[]>([]);
  totalItems = signal(0);
  isLoading = signal(true);
  isSaving = signal(false);
  uploadingImg = signal(false);

  categories = CATEGORIES;
  sizeOptions = SIZE_OPTIONS;

  searchQuery = '';
  categoryFilter = '';
  currentPage = 1;

  isModalOpen = signal(false);
  editingProduct = signal<AdminProduct | null>(null);
  deletingProduct = signal<AdminProduct | null>(null);
  formError = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  customSizeInput = '';

  form: Partial<AdminProduct> = this.resetForm();

  ngOnInit(): void {
    this.loadProducts();
  }

  resetForm(): Partial<AdminProduct> {
    return {
      title: '',
      description: '',
      category: 'Suits & Kurtis',
      price: 0,
      discounted_price: undefined,
      image_url: '',
      stock: 10,
      sizes: ['Standard'],
      badge: '',
      fabric: ''
    };
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.api.getProducts(this.currentPage, 50, this.searchQuery, this.categoryFilter).subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.products);
          this.totalItems.set(res.total);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toasts()?.show('Failed to load products', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  openAddModal(): void {
    this.editingProduct.set(null);
    this.form = this.resetForm();
    this.imagePreview.set(null);
    this.customSizeInput = '';
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(p: AdminProduct): void {
    this.editingProduct.set(p);
    this.form = { ...p, sizes: [...(p.sizes || [])] };
    this.imagePreview.set(p.image_url || null);
    this.customSizeInput = '';
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingProduct.set(null);
  }

  isSelected(size: string): boolean {
    return (this.form.sizes || []).includes(size);
  }

  toggleSize(size: string): void {
    const current = this.form.sizes ? [...this.form.sizes] : [];
    const idx = current.indexOf(size);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(size);
    }
    this.form.sizes = current;
  }

  onImageUrlChange(): void {
    this.imagePreview.set(this.form.image_url || null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingImg.set(true);
    this.formError.set(null);

    this.api.uploadImage(file).subscribe({
      next: (res) => {
        if (res.success && res.url) {
          this.form.image_url = res.url;
          this.imagePreview.set(res.url);
          this.toasts()?.show(`Image uploaded via ${res.storage}`, 'success');
        } else {
          this.formError.set('Upload response missing URL');
        }
        this.uploadingImg.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Failed to upload image file');
        this.uploadingImg.set(false);
      }
    });
  }

  saveProduct(): void {
    if (!this.form.title?.trim()) {
      this.formError.set('Please provide a product title');
      return;
    }
    if (!this.form.price || this.form.price <= 0) {
      this.formError.set('Price must be greater than 0');
      return;
    }
    if (!this.form.image_url?.trim()) {
      this.formError.set('Please provide an image URL or upload an image');
      return;
    }

    if (this.customSizeInput.trim()) {
      const customs = this.customSizeInput.split(',').map(s => s.trim()).filter(Boolean);
      const combined = Array.from(new Set([...(this.form.sizes || []), ...customs]));
      this.form.sizes = combined;
    }

    if (!this.form.sizes || this.form.sizes.length === 0) {
      this.form.sizes = ['Standard'];
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const editTarget = this.editingProduct();

    if (editTarget) {
      this.api.updateProduct(editTarget.id, this.form).subscribe({
        next: (res) => {
          if (res.success) {
            this.toasts()?.show(`"${res.product.title}" updated`, 'success');
            this.closeModal();
            this.loadProducts();
          }
          this.isSaving.set(false);
        },
        error: (err) => {
          this.formError.set(err.error?.message || 'Failed to update product');
          this.isSaving.set(false);
        }
      });
    } else {
      this.api.createProduct(this.form).subscribe({
        next: (res) => {
          if (res.success) {
            this.toasts()?.show(`"${res.product.title}" added to catalog`, 'success');
            this.closeModal();
            this.loadProducts();
          }
          this.isSaving.set(false);
        },
        error: (err) => {
          this.formError.set(err.error?.message || 'Failed to create product');
          this.isSaving.set(false);
        }
      });
    }
  }

  confirmDelete(p: AdminProduct): void {
    this.deletingProduct.set(p);
  }

  executeDelete(): void {
    const target = this.deletingProduct();
    if (!target) return;

    this.isSaving.set(true);
    this.api.deleteProduct(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toasts()?.show(`Deleted "${target.title}"`, 'info');
          this.deletingProduct.set(null);
          this.loadProducts();
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toasts()?.show(err.error?.message || 'Failed to delete product', 'error');
        this.isSaving.set(false);
      }
    });
  }
}
