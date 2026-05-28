import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { CreateUserUseCase } from '../../application/use-cases/auth/create-user.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case';
import { GetProfileUseCase } from '../../application/use-cases/auth/get-profile.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { ListUsersUseCase } from '../../application/use-cases/auth/list-users.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case';
import { GetPublicTenantUseCase } from '../../application/use-cases/auth/get-public-tenant.use-case';
import { TenantRepository } from '../../domain/repositories/tenant-repository';
import { UserRepository } from '../../domain/repositories/user-repository';
import { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token-repository';
import { AuthController } from '../controllers/auth.controller';
import { PrismaTenantRepository } from '../persistence/repositories/prisma-tenant.repository';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository';
import { PrismaPasswordResetTokenRepository } from '../persistence/repositories/prisma-password-reset-token.repository';
import { MailService } from '../services/mail/mail.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({}),
    ConfigModule,
    EventEmitterModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST', 'localhost'),
          port: config.get<number>('MAIL_PORT', 1025),
          auth: {
            user: config.get<string>('MAIL_USER', ''),
            pass: config.get<string>('MAIL_PASS', ''),
          },
        },
        defaults: {
          from: config.get<string>(
            'MAIL_FROM',
            '"Retail SaaS" <no-reply@retailsaas.com>',
          ),
        },
        template: {
          dir: join(__dirname, '../services/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
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
    {
      provide: PasswordResetTokenRepository,
      useClass: PrismaPasswordResetTokenRepository,
    },
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    GetProfileUseCase,
    CreateUserUseCase,
    ListUsersUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetPublicTenantUseCase,
    JwtStrategy,
    MailService,
  ],
  exports: [
    UserRepository,
    TenantRepository,
    PasswordResetTokenRepository,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    GetProfileUseCase,
    CreateUserUseCase,
    ListUsersUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetPublicTenantUseCase,
    MailService,
  ],
})
export class AuthModule {}
