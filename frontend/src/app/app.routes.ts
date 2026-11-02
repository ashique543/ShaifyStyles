import { Routes } from '@angular/router';
import { StorefrontComponent } from './pages/storefront/storefront.component';
import { authGuard } from './admin/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: StorefrontComponent,
    pathMatch: 'full'
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/pages/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/components/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/pages/products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/pages/categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'coupons',
        loadComponent: () => import('./admin/pages/coupons/admin-coupons.component').then(m => m.AdminCouponsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/pages/orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'deployment',
        loadComponent: () => import('./admin/pages/deployment/admin-deployment.component').then(m => m.AdminDeploymentComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
