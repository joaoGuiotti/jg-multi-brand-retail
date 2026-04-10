import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const DemosRoutes: Routes = [
    {
        path: 'demo',
        children: [
            { path: 'table', loadComponent: () => import('./features/demo/table-demo/table-demo.component').then(m => m.TableDemoComponent) },
            { path: 'autocomplete', loadComponent: () => import('./features/demo/autocomplete/autocomplete-demo.component').then(m => m.UiAutocompleteDemoComponent) },
        ]
    }
];

export const routes: Routes = [
    ...(isDevMode() ? DemosRoutes : []),
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./features/auth/forgot-password/forgot-password.component').then(
                (m) => m.ForgotPasswordComponent,
            ),
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./features/auth/reset-password/reset-password.component').then(
                (m) => m.ResetPasswordComponent,
            ),
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'pos', loadComponent: () => import('./features/sales/pages/pos/pos.component').then(m => m.PosComponent) },
            { path: 'products', loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent) },
            { path: 'products/new', loadComponent: () => import('./features/products/pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
            { path: 'products/:id/edit', loadComponent: () => import('./features/products/pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
            { path: 'customers', loadComponent: () => import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
            { path: 'customers/new', loadComponent: () => import('./features/customers/pages/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
            { path: 'customers/:id/edit', loadComponent: () => import('./features/customers/pages/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
            { path: 'sales', loadComponent: () => import('./features/sales/pages/sales-history/sales-history.component').then(m => m.SalesHistoryComponent) },
            { path: 'inventory', loadComponent: () => import('./features/inventory/pages/inventory-list/inventory-list.component').then(m => m.InventoryListComponent) },
            { path: 'reports', loadComponent: () => import('./features/reports/pages/reports-list/reports-list.component').then(m => m.ReportsListComponent) },
            { path: 'users', loadComponent: () => import('./features/users/pages/user-list/user-list.component').then(m => m.UserListComponent) },
            { path: 'users/new', loadComponent: () => import('./features/users/pages/user-form/user-form.component').then(m => m.UserFormComponent) },
        ],
    },
    { path: 'access-denied', loadComponent: () => import('./features/errors/pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent) },
    { path: '**', redirectTo: '/login' }
];
