import { TenantRepository } from '@domain/repositories/tenant-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClsService } from 'nestjs-cls';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private tenantRepository: TenantRepository,
    private cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  // Cache simples de tenants (ID -> status e tempo de expiração) para evitar bater no DB todo request
  private tenantCache = new Map<string, { active: boolean; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(
      payload.tenantId,
      payload.sub,
    );

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revocation check: if tokenVersion in JWT doesn't match the DB value,
    // the user's session was invalidated (e.g., password reset).
    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Session has been invalidated. Please log in again.',
      );
    }

    let isTenantActive = false;
    const cachedTenant = this.tenantCache.get(payload.tenantId);

    if (cachedTenant && cachedTenant.expiresAt > Date.now()) {
      isTenantActive = cachedTenant.active;
    } else {
      const tenantRecord = await this.tenantRepository.findById(payload.tenantId);
      isTenantActive = tenantRecord ? tenantRecord.active : false;
      this.tenantCache.set(payload.tenantId, {
        active: isTenantActive,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });
    }

    if (!isTenantActive) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    // Configura o Tenant ID no contexto global da requisição via CLS
    this.cls.set('tenantId', payload.tenantId);

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: payload.tenantId,
      // Nota: o objeto tenant aqui retorna null para o nome/slug pois priorizamos o cache para evitar db hit. 
      // Se necessário nos controllers, deve-se buscar explicitamente.
      tenant: {
        id: payload.tenantId,
        name: 'Cached', 
        slug: 'cached',
      },
    };
  }
}
