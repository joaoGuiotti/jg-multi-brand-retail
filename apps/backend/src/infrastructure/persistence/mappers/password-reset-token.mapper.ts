import { PasswordResetToken as PrismaPasswordResetToken } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { PasswordResetToken } from '../../../domain/entities/auth/password-reset-token.entity';

export class PasswordResetTokenMapper {
  static toDomain(raw: PrismaPasswordResetToken): PasswordResetToken {
    return PasswordResetToken.create(
      {
        tenantId: raw.tenantId,
        userId: raw.userId,
        tokenHash: raw.tokenHash,
        expiresAt: raw.expiresAt,
        usedAt: raw.usedAt,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(token: PasswordResetToken) {
    return {
      id: token.id.toString(),
      tenantId: token.tenantId,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
      createdAt: token.createdAt,
    };
  }
}
