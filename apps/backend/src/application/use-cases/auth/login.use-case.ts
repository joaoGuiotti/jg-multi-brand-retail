import { UseCase } from '@common/application/use-case.interface';
import { User } from '@domain/entities/users/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TenantRepository } from '../../../domain/repositories/tenant-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';

export type LoginInput = {
    email: string;
    password: string;
}

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
        };
    };
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {
    constructor(
        private userRepository: UserRepository,
        private tenantRepository: TenantRepository,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async execute(input: LoginInput): Promise<LoginOutput> {
        const user = await this.userRepository.findByEmail(input.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.active) {
            throw new UnauthorizedException('User is inactive');
        }

        // Check if tenant is active
        const tenant = await this.tenantRepository.findById(user.tenantId);

        if (!tenant || !tenant.active) {
            throw new UnauthorizedException('Tenant is inactive');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(input.password, user.passwordHash);

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);

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
                },
            },
            ...tokens,
        };
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
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

        return { accessToken, refreshToken };
    }
}
