import { PasswordResetToken } from '@domain/entities/auth/password-reset-token.entity';
import { PasswordResetTokenRepository } from '@domain/repositories/password-reset-token-repository';
import { Injectable } from '@nestjs/common';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    const data = PasswordResetTokenMapper.toPersistence(token);
    const created = await this.prisma.passwordResetToken.create({ data });
    return PasswordResetTokenMapper.toDomain(created);
  }

  async findLatestByUserId(userId: string): Promise<PasswordResetToken | null> {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return token ? PasswordResetTokenMapper.toDomain(token) : null;
  }

  async findById(id: string): Promise<PasswordResetToken | null> {
    const token = await this.prisma.withAuthLookup(async (tx) => {
      return await tx.passwordResetToken.findUnique({
        where: { id },
      });
    });
    return token ? PasswordResetTokenMapper.toDomain(token) : null;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.withAuthLookup(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id },
        data: { usedAt: new Date() },
      });
    });
  }

  async deleteAllForUser(tenantId: string, userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId, tenantId },
    });
  }
}
