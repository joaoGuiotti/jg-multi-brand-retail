import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    // { path: 'register', component: RegisterComponent },
    // {
    //     path: '',
    //     component: MainLayoutComponent,
    //     canActivate: [authGuard],
    //     children: [
    //         { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    //         { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    //         { path: 'pos', loadComponent: () => import('./features/sales/pages/pos/pos.component').then(m => m.PosComponent) },
    //         { path: 'products', loadComponent: () => import('./features/products/pages/product-list/product-list.component').then(m => m.ProductListComponent) },
    //         { path: 'products/new', loadComponent: () => import('./features/products/pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
    //         { path: 'products/:id/edit', loadComponent: () => import('./features/products/pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
    //         { path: 'sales', loadComponent: () => import('./features/sales/pages/sales-history/sales-history.component').then(m => m.SalesHistoryComponent) },
    //     ]
    // },
    { path: '**', redirectTo: '/login' }
];
