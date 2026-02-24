import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/auth.model';
import { IResponse } from '../models/response-base';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_KEY = 'access_token';

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signal for reactive components
    public user = signal<User | null>(null);

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.loadUserFromToken();
    }

    login(credentials: LoginRequest): Observable<IResponse<LoginResponse>> {
        return this.http.post<IResponse<LoginResponse>>(`${this.API_URL}/auth/login`, credentials)
            .pipe(
                tap((response: IResponse<LoginResponse>) => this.handleAuthResponse(response.data))
            );
    }

    register(data: RegisterRequest): Observable<IResponse<LoginResponse>> {
        return this.http.post<IResponse<LoginResponse>>(`${this.API_URL}/auth/register`, data)
            .pipe(
                tap((response: IResponse<LoginResponse>) => this.handleAuthResponse(response.data))
            );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUserSubject.next(null);
        this.user.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private handleAuthResponse(response: LoginResponse): void {
        if (response.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, response.accessToken);
            this.loadUserFromToken();
        }
    }

    private loadUserFromToken(): void {
        const token = this.getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const user: User = {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    role: payload.role,
                    tenantId: payload.tenantId
                };
                this.currentUserSubject.next(user);
                this.user.set(user);
            } catch (error) {
                this.logout();
            }
        }
    }
}
