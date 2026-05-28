import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma entrada imutável na tabela audit_logs para rastreamento de ações críticas.
   */
  async log(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: AuditAction,
    changes: any,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        tenantId,
        userId,
        entityType,
        entityId,
        action,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
      },
    });
  }
}
