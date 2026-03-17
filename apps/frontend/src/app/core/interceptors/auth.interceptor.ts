import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token');
    const router = inject(Router);

    // Clone request and add authorization header if token exists
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // Handle the request and catch errors
    return next(req).pipe(
        catchError((error) => {
            // Handle 401 Unauthorized - redirect to login
            if (error.status === 401) {
                localStorage.removeItem('access_token');
                router.navigate(['/login']);
            } else if (error.status === 403) {
                // Handle 403 Forbidden - redirect to access denied
                router.navigate(['/access-denied'], {
                    queryParams: { 
                        title: 'Acesso Negado', 
                        message: 'Você não tem permissão para realizar esta ação ou acessar este recurso.' 
                    }
                });
            }
            return throwError(() => error);
        })
    );
};
