export interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    tenantId: string;
    logoUrl?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    tenantName: string;
}
