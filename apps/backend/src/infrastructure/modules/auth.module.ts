import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GetProfileUseCase } from '../../application/use-cases/auth/get-profile.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { TenantRepository } from '../../domain/repositories/tenant-repository';
import { UserRepository } from '../../domain/repositories/user-repository';
import { AuthController } from '../controllers/auth.controller';
import { PrismaTenantRepository } from '../persistence/repositories/prisma-tenant.repository';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaModule } from './prisma.module';

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({}),
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [
        {
            provide: UserRepository,
            useClass: PrismaUserRepository,
        },
        {
            provide: TenantRepository,
            useClass: PrismaTenantRepository,
        },
        RegisterUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        GetProfileUseCase,
        JwtStrategy,
    ],
    exports: [
        UserRepository,
        TenantRepository,
        RegisterUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        GetProfileUseCase,
    ],
})
export class AuthModule { }
