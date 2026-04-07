import { PasswordResetToken } from '../entities/auth/password-reset-token.entity';

export abstract class PasswordResetTokenRepository {
  abstract create(token: PasswordResetToken): Promise<PasswordResetToken>;
  abstract findLatestByUserId(
    userId: string,
  ): Promise<PasswordResetToken | null>;
  abstract findById(id: string): Promise<PasswordResetToken | null>;
  abstract markAsUsed(id: string): Promise<void>;
  abstract deleteAllForUser(tenantId: string, userId: string): Promise<void>;
}
