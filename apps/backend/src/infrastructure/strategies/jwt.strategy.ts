import { TenantRepository } from '@domain/repositories/tenant-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

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

    const tenant = await this.tenantRepository.findById(payload.tenantId);

    if (!tenant || !tenant.active) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: payload.tenantId,
      tenant: {
        id: tenant.id.toString(),
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }
}
