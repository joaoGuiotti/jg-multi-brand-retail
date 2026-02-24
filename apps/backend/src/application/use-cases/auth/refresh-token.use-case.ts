import { UseCase } from '@common/application/use-case.interface';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export type RefreshTokenInput = {
    refreshToken: string;
}

export type RefreshTokenOutput = {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase implements UseCase<RefreshTokenInput, RefreshTokenOutput> {
    constructor(
        private userRepository: UserRepository,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
        try {
            const payload = this.jwtService.verify(input.refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.userRepository.findById(payload.sub);

            if (!user || !user.active) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(
                user.id.toString(),
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
        const payload = { sub: userId, email, tenantId, role };

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
