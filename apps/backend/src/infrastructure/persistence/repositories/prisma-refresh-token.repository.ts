import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateRefreshTokenData,
  RefreshTokenRecord,
  RefreshTokenRepository,
  SecurityAlertData,
} from '../../../domain/repositories/refresh-token-repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord> {
    const id = data.id || uuidv4();
    return await this.prisma.withAuthLookup(async (tx) => {
      const record = await tx.refreshToken.create({
        data: {
          id,
          tenantId: data.tenantId,
          userId: data.userId,
          tokenHash: data.tokenHash,
          familyId: data.familyId,
          expiresAt: data.expiresAt,
          ip: data.ip ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
      return record;
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return await this.prisma.withAuthLookup(async (tx) => {
      return await tx.refreshToken.findUnique({
        where: { tokenHash },
      });
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.withAuthLookup(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { familyId },
        data: { revokedAt: new Date() },
      });
    });
  }

  async rotateToken(
    oldTokenId: string,
    newToken: CreateRefreshTokenData,
  ): Promise<RefreshTokenRecord> {
    const newId = newToken.id || uuidv4();
    return await this.prisma.withAuthLookup(async (tx) => {
      // 1. Invalida o token antigo marcando como substituído
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: newId,
        },
      });

      // 2. Cria o novo token na mesma família
      const created = await tx.refreshToken.create({
        data: {
          id: newId,
          tenantId: newToken.tenantId,
          userId: newToken.userId,
          tokenHash: newToken.tokenHash,
          familyId: newToken.familyId,
          expiresAt: newToken.expiresAt,
          ip: newToken.ip ?? null,
          userAgent: newToken.userAgent ?? null,
        },
      });

      return created;
    });
  }

  async recordSecurityAlert(data: SecurityAlertData): Promise<void> {
    await this.prisma.withAuthLookup(async (tx) => {
      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          entityType: 'SECURITY_ALERT',
          entityId: data.familyId,
          action: 'UPDATE',
          changes: {
            event: 'REFRESH_TOKEN_REUSE_DETECTED',
            familyId: data.familyId,
            revokedTokenId: data.revokedTokenId,
            ip: data.ip ?? null,
            userAgent: data.userAgent ?? null,
          },
        },
      });
    });
  }
}
