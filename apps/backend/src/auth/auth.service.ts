import {
    ConflictException,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }
        // Normalize email to create tenant slug
        const tenantSlug = dto.tenantSlug || this.normalizeString(dto.tenantName);

        // Check if tenant exists or create new one
        let tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            // Create new tenant (first user will be admin)
            tenant = await this.prisma.tenant.create({
                data: {
                    name: dto.tenantName,
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
                },
            });
        }

        // Check if this is the first user in the tenant
        const userCount = await this.prisma.user.count({
            where: { tenantId: tenant.id },
        });

        const role = userCount === 0 ? Role.ADMIN : Role.USER;

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                role,
                tenantId: tenant.id,
                active: true,
            },
            include: {
                tenant: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                },
            },
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                tenant: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.active) {
            throw new UnauthorizedException('User is inactive');
        }

        // Check if tenant is active
        if (!user.tenant.active) {
            throw new UnauthorizedException('Tenant is inactive');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant: {
                    id: user.tenant.id,
                    name: user.tenant.name,
                    slug: user.tenant.slug,
                },
            },
            ...tokens,
        };
    }

    async refreshToken(dto: RefreshTokenDto) {
        try {
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.active) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(
                user.id,
                user.email,
                user.tenantId,
                user.role,
            );

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateTokens(
        userId: string,
        email: string,
        tenantId: string,
        role: Role,
    ) {
        const payload = {
            sub: userId,
            email,
            tenantId,
            role,
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

        return {
            accessToken,
            refreshToken,
        };
    }

    private normalizeString(value: string): string {
        return value.normalize("NFD")
            .replaceAll(' ', '-')
            .replaceAll('@', '-')
            .replaceAll('.', '-')
            .toLowerCase();
    }
}
