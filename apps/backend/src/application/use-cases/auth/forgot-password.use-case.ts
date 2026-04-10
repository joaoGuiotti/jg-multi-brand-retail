import { UseCase } from '@common/application/use-case.interface';
import { PasswordResetToken } from '@domain/entities/auth/password-reset-token.entity';
import { PasswordResetTokenRepository } from '@domain/repositories/password-reset-token-repository';
import { TenantRepository } from '@domain/repositories/tenant-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UniqueEntityID } from '@common/domain/unique-entity-id';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordOutput = {
  message: string;
};

const GENERIC_MESSAGE =
  'If this email is registered, you will receive a password reset link shortly.';
const TOKEN_TTL_HOURS = 1;
const RATE_LIMIT_MINUTES = 5;

@Injectable()
export class ForgotPasswordUseCase implements UseCase<
  ForgotPasswordInput,
  ForgotPasswordOutput
> {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordOutput> {
    // Always return the same message — anti user-enumeration
    const result = await this.userRepository.findByEmail(input.email);

    if (!result || !result.user.active) {
      return { message: GENERIC_MESSAGE };
    }

    const { user, tenantId } = result;

    // Check if tenant is active
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant || !tenant.active) {
      return { message: GENERIC_MESSAGE };
    }

    // Rate limit: block if a valid token was issued within the last RATE_LIMIT_MINUTES
    const existingToken = await this.tokenRepository.findLatestByUserId(
      user.id.toString(),
    );
    if (existingToken && existingToken.isValid()) {
      const rateLimitMs = RATE_LIMIT_MINUTES * 60 * 1000;
      const tokenAge = Date.now() - (existingToken.createdAt?.getTime() ?? 0);
      if (tokenAge < rateLimitMs) {
        this.logger.log(
          `Rate limit hit for ${input.email} — skipping new token`,
        );
        return { message: GENERIC_MESSAGE };
      }
    }

    // Delete any existing tokens before creating a new one
    await this.tokenRepository.deleteAllForUser(tenantId, user.id.toString());

    // Generate cryptographically random token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(plainToken, 10);

    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    const resetToken = PasswordResetToken.create(
      {
        tenantId,
        userId: user.id.toString(),
        tokenHash,
        expiresAt,
        usedAt: null,
      },
      new UniqueEntityID(),
    );

    await this.tokenRepository.create(resetToken);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(input.email)}`;

    // Fire-and-forget: email dispatch is handled by MailService @OnEvent listener
    this.eventEmitter.emit('auth.forgot-password', {
      to: input.email,
      userName: user.name,
      tenantName: tenant.name,
      tenantLogoUrl: tenant.logoUrl,
      resetUrl,
      expiryMinutes: TOKEN_TTL_HOURS * 60,
    });

    return { message: GENERIC_MESSAGE };
  }
}
