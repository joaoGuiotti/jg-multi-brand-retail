import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 1. Para login: rastreia por IP + email para barrar credential stuffing sem penalizar usuários legítimos
    if (req.url?.includes('/auth/login') && req.body?.email) {
      const email = String(req.body.email).toLowerCase().trim();
      const ip = req.ips?.length ? req.ips[0] : req.ip;
      return `login-${ip}-${email}`;
    }

    // 2. Para endpoints com tenant autenticado: rastreia por tenantId + IP
    if (req.user?.tenantId) {
      const ip = req.ips?.length ? req.ips[0] : req.ip;
      return `tenant-${req.user.tenantId}-${ip}`;
    }

    // 3. Fallback: IP do cliente
    return req.ips?.length ? req.ips[0] : req.ip;
  }
}
