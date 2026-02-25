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
        ]
    }
];

export const routes: Routes = [
    ...(isDevMode() ? DemosRoutes : []),
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
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
            { path: 'sales', loadComponent: () => import('./features/sales/pages/sales-history/sales-history.component').then(m => m.SalesHistoryComponent) },
            { path: 'inventory', loadComponent: () => import('./features/inventory/pages/inventory-list/inventory-list.component').then(m => m.InventoryListComponent) },
            { path: 'reports', loadComponent: () => import('./features/reports/pages/reports-list/reports-list.component').then(m => m.ReportsListComponent) },
        ]
    },
    { path: '**', redirectTo: '/login' }
];
