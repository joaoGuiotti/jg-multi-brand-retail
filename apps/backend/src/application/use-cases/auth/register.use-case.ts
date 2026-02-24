import { UseCase } from '@common/application/use-case.interface';
import { Tenant } from '@domain/entities/tenants/tenant.entity';
import { User } from '@domain/entities/users/user.entity';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthOutput } from './common/auth-output';

export type RegisterInput = {
    email: string;
    password: string;
    name: string;
    tenantName: string;
    tenantSlug?: string;
}

@Injectable()
export class RegisterUseCase implements UseCase<RegisterInput, AuthOutput> {
    constructor(
        private userRepository: UserRepository,
        private tenantRepository: TenantRepository,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async execute(input: RegisterInput): Promise<AuthOutput> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(input.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Normalize email to create tenant slug if not provided
        const tenantSlug = input.tenantSlug || this.normalizeString(input.tenantName);

        // Check if tenant exists or create new one
        let tenant = await this.tenantRepository.findBySlug(tenantSlug);

        if (!tenant) {
            tenant = Tenant.create({
                name: input.tenantName,
                slug: tenantSlug,
                active: true,
                settings: {
                    currency: 'BRL',
                    timezone: 'America/Sao_Paulo',
                    features: {
                        conditionals: true,
                        inventory: true,
                    },
                },
            });
            await this.tenantRepository.create(tenant);
        }

        // Check if this is the first user in the tenant to assign ADMIN role
        const userCount = await this.userRepository.countByTenant(tenant.id.toString());
        const role = userCount === 0 ? Role.ADMIN : Role.USER;

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user
        const user = User.create({
            email: input.email,
            passwordHash,
            name: input.name,
            role,
            tenantId: tenant.id.toString(),
            active: true,
        });

        await this.userRepository.create(user);

        // Generate tokens
        const tokens = await this.generateTokens(user, role);

        return {
            ...tokens,
        } satisfies AuthOutput;
    }

    private async generateTokens(
        user: User,
        role: Role,
    ) {
        const payload = {
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                role,
                tenantId: user.tenantId,
            },
            role
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

    private normalizeString(value: string): string {
        return value.normalize("NFD")
            .replaceAll(' ', '-')
            .replaceAll('@', '-')
            .replaceAll('.', '-')
            .toLowerCase();
    }
}
