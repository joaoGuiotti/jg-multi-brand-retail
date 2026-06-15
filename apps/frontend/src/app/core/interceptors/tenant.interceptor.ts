import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);
  const authService = inject(AuthService);

  // 1. Prioridade para o Tenant resolvido pela URL (Subdomínio ou Query Param)
  // 2. Fallback para o Tenant ID que vem dentro do JWT Token do usuário logado
  const tenantId = tenantService.currentTenantId() || authService.user()?.tenantId;

  // Se um tenant foi identificado, injeta o cabeçalho
  if (tenantId) {
    req = req.clone({
      setHeaders: {
        'X-Tenant-ID': tenantId,
      },
    });
  }

  return next(req);
};
