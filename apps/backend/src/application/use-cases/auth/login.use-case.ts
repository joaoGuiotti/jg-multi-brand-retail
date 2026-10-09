import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UseCase } from '@common/application/use-case.interface';
import { User } from '@domain/entities/users/user.entity';
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TenantRepository } from '../../../domain/repositories/tenant-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token-repository';

export type LoginInput = {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
};

export type LoginOutput = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    tenant: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
  };
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {
  constructor(
    private userRepository: UserRepository,
    private tenantRepository: TenantRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Optional() private refreshTokenRepository?: RefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const result = await this.userRepository.findByEmail(input.email);

    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, tenantId } = result;

    // Check if user is active
    if (!user.active) {
      throw new UnauthorizedException('User is inactive');
    }

    // Check if tenant is active
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant || !tenant.active) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      user,
      tenantId,
      tenant.logoUrl,
      input.ip,
      input.userAgent,
    );

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
        },
      },
      ...tokens,
    };
  }

  private async generateTokens(
    user: User,
    tenantId: string,
    logoUrl?: string | null,
    ip?: string,
    userAgent?: string,
  ) {
    const familyId = uuidv4();
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: tenantId,
      logoUrl: logoUrl,
      tokenVersion: user.tokenVersion,
      familyId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    if (this.refreshTokenRepository) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await this.refreshTokenRepository.create({
        tenantId,
        userId: user.id.toString(),
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      });
    }

    return { accessToken, refreshToken };
  }
}
