import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  PublicTenant,
} from '../models/auth.model';
import { IResponse } from '../models/response-base';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  // Signal for reactive components
  public user = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromToken();
  }

  login(credentials: LoginRequest): Observable<IResponse<LoginResponse>> {
    return this.http
      .post<IResponse<LoginResponse>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(tap((response: IResponse<LoginResponse>) => this.handleAuthResponse(response.data)));
  }

  register(data: RegisterRequest): Observable<IResponse<LoginResponse>> {
    return this.http
      .post<IResponse<LoginResponse>>(`${this.API_URL}/auth/register`, data)
      .pipe(tap((response: IResponse<LoginResponse>) => this.handleAuthResponse(response.data)));
  }

  listUsers(): Observable<IResponse<User[]>> {
    return this.http.get<IResponse<User[]>>(`${this.API_URL}/auth/users`);
  }

  createUser(data: Partial<User> & { password?: string }): Observable<IResponse<User>> {
    return this.http.post<IResponse<User>>(`${this.API_URL}/auth/users`, data);
  }

  getPublicTenant(slug: string): Observable<IResponse<PublicTenant>> {
    return this.http.get<IResponse<PublicTenant>>(`${this.API_URL}/auth/tenants/by-slug/${slug}`);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(
    token: string,
    email: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/auth/reset-password`, {
      token,
      email,
      newPassword,
    });
  }

  logout(): void {
    this.http.post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {},
    });
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<IResponse<{ accessToken: string }>> {
    return this.http
      .post<IResponse<{ accessToken: string }>>(
        `${this.API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          if (res.data?.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
            this.loadUserFromToken();
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
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
        const payload = this.jwtHelper.decodeToken(token);
        if (payload) {
          const user: User = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            tenantId: payload.tenantId,
            logoUrl: payload.logoUrl,
          };
          this.currentUserSubject.next(user);
          this.user.set(user);
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Token decode error:', error);
        this.logout();
      }
    }
  }
}
