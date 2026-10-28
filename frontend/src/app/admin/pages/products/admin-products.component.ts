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
  template: `
    <app-admin-toasts #toasts></app-admin-toasts>

    <div class="admin-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Product Catalog</h1>
          <p class="page-subtitle">Manage your boutique collection — {{ totalItems() }} products</p>
        </div>
        <button class="btn-add" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Product
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-inp" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search product title or description…" />
        </div>
        <select class="filter-select" [(ngModel)]="categoryFilter" (change)="loadProducts()">
          <option value="">All Categories</option>
          @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <button class="refresh-btn" (click)="loadProducts()">Refresh</button>
      </div>

      <!-- Table -->
      @if (isLoading()) {
        <div class="table-skeleton">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="row-skeleton"></div>
          }
        </div>
      } @else {
        <div class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sizes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of products(); track p.id) {
                  <tr>
                    <td>
                      <img [src]="p.image_url" [alt]="p.title" class="thumb" onerror="this.src='https://placehold.co/50x50/F9ECEF/873649?text=SS'" />
                    </td>
                    <td>
                      <div class="title-cell">
                        <span class="product-title">{{ p.title }}</span>
                        @if (p.badge) { <span class="badge-chip">{{ p.badge }}</span> }
                      </div>
                    </td>
                    <td><span class="cat-tag">{{ p.category }}</span></td>
                    <td>
                      <div class="price-cell">
                        <span class="current-price">₹{{ (p.discounted_price ?? p.price) | number:'1.0-0' }}</span>
                        @if (p.discounted_price) {
                          <span class="orig-price">₹{{ p.price | number:'1.0-0' }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="stock-chip" [class.low]="p.stock < 5" [class.out]="p.stock === 0">
                        {{ p.stock === 0 ? 'Out of Stock' : p.stock }}
                      </span>
                    </td>
                    <td>
                      <span class="sizes-preview">{{ p.sizes?.slice(0,2).join(', ') }}{{ (p.sizes?.length ?? 0) > 2 ? '…' : '' }}</span>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn edit" (click)="openEditModal(p)" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button class="act-btn delete" (click)="confirmDelete(p)" title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (products().length === 0) {
                  <tr>
                    <td colspan="7" class="empty-row">
                      No products found. <button class="link-btn" (click)="openAddModal()">Add one now</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Prev</button>
              <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Next →</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Add / Edit Product Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="product-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingProduct() ? 'Edit Product' : 'Add New Product' }}</h2>
            <button class="close-modal" (click)="closeModal()">×</button>
          </div>

          <form class="modal-form" (ngSubmit)="saveProduct()">
            <div class="form-grid">
              <div class="field full">
                <label>Product Title *</label>
                <input type="text" [(ngModel)]="form.title" name="title" placeholder="e.g. Crimson Rose Lawn Suit" required />
              </div>

              <div class="field">
                <label>Category *</label>
                <select [(ngModel)]="form.category" name="category" required>
                  <option value="">Select category…</option>
                  @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>

              <div class="field">
                <label>Fabric / Material</label>
                <input type="text" [(ngModel)]="form.fabric" name="fabric" placeholder="e.g. Premium Swiss Lawn" />
              </div>

              <div class="field">
                <label>Price (₹) *</label>
                <input type="number" [(ngModel)]="form.price" name="price" placeholder="3899" min="0" required />
              </div>

              <div class="field">
                <label>Discounted Price (₹)</label>
                <input type="number" [(ngModel)]="form.discounted_price" name="discounted_price" placeholder="3299" min="0" />
              </div>

              <div class="field">
                <label>Stock Count *</label>
                <input type="number" [(ngModel)]="form.stock" name="stock" placeholder="10" min="0" required />
              </div>

              <div class="field">
                <label>Badge (optional)</label>
                <input type="text" [(ngModel)]="form.badge" name="badge" placeholder="e.g. Bestseller, New Launch" />
              </div>

              <div class="field full">
                <label>Description</label>
                <textarea [(ngModel)]="form.description" name="description" rows="3" placeholder="Detailed product description…"></textarea>
              </div>

              <!-- Size Picker -->
              <div class="field full">
                <label>Sizes / Style Options</label>
                <div class="sizes-grid">
                  @for (s of sizeOptions; track s) {
                    <label class="size-toggle" [class.selected]="isSelected(s)">
                      <input type="checkbox" [checked]="isSelected(s)" (change)="toggleSize(s)" style="display:none"/>
                      {{ s }}
                    </label>
                  }
                </div>
                <input type="text" class="sizes-custom" [(ngModel)]="customSizeInput" name="customSize"
                  placeholder="Or type custom sizes comma-separated: e.g. S, M, L" />
              </div>

              <!-- Image Upload / URL -->
              <div class="field full">
                <label>Product Image *</label>
                <div class="image-upload-area">
                  @if (imagePreview()) {
                    <img [src]="imagePreview()!" alt="Preview" class="img-preview" />
                  }
                  <div class="upload-controls">
                    <label class="upload-file-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {{ uploadingImg() ? 'Uploading…' : 'Upload Image' }}
                      <input type="file" accept="image/*" (change)="onFileSelected($event)" style="display:none" [disabled]="uploadingImg()" />
                    </label>
                    <span class="divider-text">or paste URL</span>
                    <input type="text" [(ngModel)]="form.image_url" name="image_url" placeholder="https://… or /assets/…"
                      (input)="onImageUrlChange()" />
                  </div>
                </div>
              </div>
            </div>

            @if (formError()) {
              <div class="form-error">{{ formError() }}</div>
            }

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="isSaving()">
                {{ isSaving() ? 'Saving…' : (editingProduct() ? 'Update Product' : 'Create Product') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deletingProduct()) {
      <div class="modal-backdrop" (click)="deletingProduct.set(null)">
        <div class="confirm-modal" (click)="$event.stopPropagation()">
          <div class="confirm-icon">🗑️</div>
          <h3>Delete Product?</h3>
          <p>Are you sure you want to permanently delete <strong>"{{ deletingProduct()!.title }}"</strong>? This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="deletingProduct.set(null)">Cancel</button>
            <button class="btn-delete-confirm" (click)="executeDelete()" [disabled]="isSaving()">
              {{ isSaving() ? 'Deleting…' : 'Delete Product' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-family: 'Playfair Display', serif; font-size: 1.85rem; color: #252021; margin-bottom: 0.25rem; }
    .page-subtitle { font-size: 0.9rem; color: #8E8286; }
    .btn-add {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.7rem 1.25rem; background: linear-gradient(135deg, #A3485E, #873649);
      color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(163,72,94,0.3);
    }
    .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(163,72,94,0.4); }
    .filters-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
    .search-wrapper { position: relative; flex: 1; min-width: 220px; }
    .search-ico { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #8E8286; pointer-events: none; }
    .search-inp { width: 100%; padding: 0.6rem 0.75rem 0.6rem 2.25rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-family: inherit; }
    .search-inp:focus { outline: none; border-color: #A3485E; box-shadow: 0 0 0 3px rgba(163,72,94,0.1); }
    .filter-select { padding: 0.6rem 0.85rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-family: inherit; cursor: pointer; }
    .refresh-btn { padding: 0.6rem 1rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FFFFFF; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .refresh-btn:hover { border-color: #A3485E; color: #A3485E; }
    .table-skeleton { display: flex; flex-direction: column; gap: 0.6rem; }
    .row-skeleton { height: 54px; border-radius: 8px; background: linear-gradient(90deg, #F0E8E1 25%, #F7F1EC 50%, #F0E8E1 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .table-card { background: #FFFFFF; border: 1px solid #E8DFD8; border-radius: 14px; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    thead th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #8E8286; font-weight: 700; padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #E8DFD8; background: #FAF7F2; white-space: nowrap; }
    tbody td { padding: 0.8rem 1rem; font-size: 0.875rem; color: #252021; border-bottom: 1px solid #F4EFE6; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #FDFBF8; }
    .thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #E8DFD8; }
    .title-cell { display: flex; flex-direction: column; gap: 0.2rem; }
    .product-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; display: block; }
    .badge-chip { font-size: 0.68rem; background: #F9ECEF; color: #873649; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600; align-self: flex-start; }
    .cat-tag { font-size: 0.72rem; background: #F4EFE6; color: #A37E36; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; white-space: nowrap; }
    .price-cell { display: flex; flex-direction: column; gap: 0.1rem; }
    .current-price { font-weight: 700; }
    .orig-price { font-size: 0.75rem; color: #8E8286; text-decoration: line-through; }
    .stock-chip { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 9999px; background: #E8F5E9; color: #2E7D32; }
    .stock-chip.low { background: #FFF3E0; color: #E65100; }
    .stock-chip.out { background: #FFEBEE; color: #C62828; }
    .sizes-preview { font-size: 0.78rem; color: #594F52; }
    .action-btns { display: flex; gap: 0.4rem; }
    .act-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid #E8DFD8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; background: #FFFFFF; }
    .act-btn.edit:hover { background: #E3F2FD; border-color: #1565C0; color: #1565C0; }
    .act-btn.delete:hover { background: #FFEBEE; border-color: #C62828; color: #C62828; }
    .empty-row { text-align: center; color: #8E8286; padding: 2rem; }
    .link-btn { color: #A3485E; font-weight: 600; background: none; border: none; cursor: pointer; text-decoration: underline; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border-top: 1px solid #E8DFD8; font-size: 0.875rem; }
    .pagination button { padding: 0.4rem 0.85rem; border: 1px solid #E8DFD8; border-radius: 6px; background: #FFFFFF; cursor: pointer; font-family: inherit; font-size: 0.875rem; font-weight: 600; transition: all 0.15s; }
    .pagination button:hover:not(:disabled) { border-color: #A3485E; color: #A3485E; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    /* Modal styles */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(37,32,33,0.65); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; overflow-y: auto; }
    .product-modal { background: #FFFFFF; border-radius: 18px; width: 100%; max-width: 760px; box-shadow: 0 24px 60px rgba(37,32,33,0.25); animation: slideUp 0.25s ease-out; margin: auto; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8DFD8; }
    .modal-header h2 { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: #252021; }
    .close-modal { width: 32px; height: 32px; border-radius: 50%; background: #FAF7F2; border: 1px solid #E8DFD8; font-size: 1.35rem; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #252021; }
    .close-modal:hover { background: #FFEBEE; color: #C62828; }
    .modal-form { padding: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 0.8rem; font-weight: 700; color: #252021; }
    .field input, .field select, .field textarea { padding: 0.65rem 0.85rem; border: 1.5px solid #E8DFD8; border-radius: 8px; background: #FAF7F2; font-size: 0.875rem; font-family: inherit; color: #252021; transition: all 0.2s; }
    .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #A3485E; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(163,72,94,0.1); }
    .sizes-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
    .size-toggle { padding: 0.35rem 0.75rem; border-radius: 6px; border: 1.5px solid #E8DFD8; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; user-select: none; }
    .size-toggle.selected { background: #A3485E; color: white; border-color: #A3485E; }
    .size-toggle:hover:not(.selected) { border-color: #A3485E; color: #A3485E; }
    .sizes-custom { width: 100%; }
    .image-upload-area { display: flex; flex-direction: column; gap: 0.75rem; }
    .img-preview { width: 100%; height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid #E8DFD8; }
    .upload-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .upload-file-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1rem; background: #252021; color: white; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; flex-shrink: 0; }
    .upload-file-btn:hover { background: #A3485E; }
    .divider-text { font-size: 0.8rem; color: #8E8286; flex-shrink: 0; }
    .upload-controls input[type="text"] { flex: 1; min-width: 180px; padding: 0.55rem 0.85rem; border: 1.5px solid #E8DFD8; border-radius: 8px; font-size: 0.875rem; font-family: inherit; }
    .upload-controls input[type="text"]:focus { outline: none; border-color: #A3485E; }
    .form-error { background: #FFEBEE; color: #C62828; padding: 0.65rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #E8DFD8; }
    .btn-cancel { padding: 0.65rem 1.25rem; background: #FAF7F2; border: 1px solid #E8DFD8; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-save { padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #A3485E, #873649); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .confirm-modal { background: #FFFFFF; border-radius: 16px; max-width: 440px; width: 100%; padding: 2rem; text-align: center; box-shadow: 0 24px 60px rgba(37,32,33,0.25); animation: slideUp 0.25s ease-out; margin: auto; }
    .confirm-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .confirm-modal h3 { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: #252021; margin-bottom: 0.5rem; }
    .confirm-modal p { font-size: 0.9rem; color: #594F52; margin-bottom: 1.5rem; }
    .confirm-actions { display: flex; gap: 0.75rem; justify-content: center; }
    .btn-delete-confirm { padding: 0.65rem 1.5rem; background: #C62828; color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .admin-page { padding: 1rem; } }
  `]
})
export class AdminProductsComponent implements OnInit {
  private api = inject(AdminApiService);

  products = signal<AdminProduct[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  editingProduct = signal<AdminProduct | null>(null);
  deletingProduct = signal<AdminProduct | null>(null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  uploadingImg = signal(false);
  searchQuery = '';
  categoryFilter = '';
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  categories = CATEGORIES;
  sizeOptions = SIZE_OPTIONS;
  customSizeInput = '';

  toastsRef = viewChild.required(AdminToastsComponent);

  form: Partial<AdminProduct & { sizes: string[] }> = {};
  private selectedSizes: string[] = [];

  ngOnInit(): void { this.loadProducts(); }

  private searchTimer: any;
  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProducts(), 400);
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.api.getProducts(this.currentPage(), 20, this.searchQuery, this.categoryFilter).subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.pages || 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goToPage(p: number): void { this.currentPage.set(p); this.loadProducts(); }

  isSelected(size: string): boolean { return this.selectedSizes.includes(size); }
  toggleSize(size: string): void {
    if (this.selectedSizes.includes(size)) {
      this.selectedSizes = this.selectedSizes.filter(s => s !== size);
    } else {
      this.selectedSizes = [...this.selectedSizes, size];
    }
  }

  openAddModal(): void {
    this.editingProduct.set(null);
    this.form = { stock: 10, sizes: [] };
    this.selectedSizes = [];
    this.customSizeInput = '';
    this.imagePreview.set(null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(product: AdminProduct): void {
    this.editingProduct.set(product);
    this.form = { ...product, sizes: [...(product.sizes || [])] };
    this.selectedSizes = [...(product.sizes || [])];
    this.customSizeInput = '';
    this.imagePreview.set(product.image_url || null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingProduct.set(null); }

  onImageUrlChange(): void {
    if (this.form.image_url) this.imagePreview.set(this.form.image_url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.uploadingImg.set(true);
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.image_url = res.url;
          this.toastsRef().show('Image uploaded successfully!', 'success');
        }
        this.uploadingImg.set(false);
      },
      error: () => {
        this.toastsRef().show('Image upload failed. Paste a URL instead.', 'error');
        this.uploadingImg.set(false);
      }
    });
  }

  private buildSizesList(): string[] {
    const fromCheckboxes = [...this.selectedSizes];
    if (this.customSizeInput.trim()) {
      const custom = this.customSizeInput.split(',').map(s => s.trim()).filter(Boolean);
      for (const s of custom) {
        if (!fromCheckboxes.includes(s)) fromCheckboxes.push(s);
      }
    }
    return fromCheckboxes.length > 0 ? fromCheckboxes : ['Standard'];
  }

  saveProduct(): void {
    const payload = { ...this.form, sizes: this.buildSizesList() };
    if (!payload.title?.trim()) { this.formError.set('Product title is required'); return; }
    if (!payload.category) { this.formError.set('Category is required'); return; }
    if (!payload.price || payload.price <= 0) { this.formError.set('Price must be greater than 0'); return; }
    if (!payload.image_url?.trim()) { this.formError.set('Product image is required'); return; }

    this.isSaving.set(true);
    this.formError.set(null);
    const obs = this.editingProduct()
      ? this.api.updateProduct(this.editingProduct()!.id, payload)
      : this.api.createProduct(payload);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.toastsRef().show(res.message, 'success');
          this.closeModal();
          this.loadProducts();
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Failed to save product');
        this.isSaving.set(false);
      }
    });
  }

  confirmDelete(product: AdminProduct): void { this.deletingProduct.set(product); }

  executeDelete(): void {
    const p = this.deletingProduct();
    if (!p) return;
    this.isSaving.set(true);
    this.api.deleteProduct(p.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastsRef().show(res.message, 'success');
          this.deletingProduct.set(null);
          this.loadProducts();
        }
        this.isSaving.set(false);
      },
      error: () => { this.toastsRef().show('Failed to delete product', 'error'); this.isSaving.set(false); }
    });
  }
}
