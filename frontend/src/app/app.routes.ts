import { Routes } from '@angular/router';
import { StorefrontComponent } from './pages/storefront/storefront.component';
import { AdminLayoutComponent } from './admin/components/admin-layout.component';
import { AdminLoginComponent } from './admin/pages/login/admin-login.component';
import { AdminDashboardComponent } from './admin/pages/dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './admin/pages/products/admin-products.component';
import { AdminOrdersComponent } from './admin/pages/orders/admin-orders.component';
import { authGuard } from './admin/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: StorefrontComponent,
    pathMatch: 'full'
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'products',
        component: AdminProductsComponent
      },
      {
        path: 'orders',
        component: AdminOrdersComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
