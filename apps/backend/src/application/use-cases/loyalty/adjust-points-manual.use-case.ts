import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';
import { LoyaltyTransaction } from '../../../domain/entities/loyalty/loyalty-transaction.entity';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuditLogsService } from '../../../infrastructure/services/audit-logs.service';
import { AuditAction } from '@prisma/client';

export interface AdjustPointsManualInput {
  tenantId: string;
  userId: string;
  customerId: string;
  points: number;
  reason: string;
}

export interface AdjustPointsManualOutput {
  customerId: string;
  pointsAdjusted: number;
  newBalance: number;
  reason: string;
  accountId: string;
}

@Injectable()
export class AdjustPointsManualUseCase {
  private readonly logger = new Logger(AdjustPointsManualUseCase.name);

  constructor(
    private readonly loyaltyRepository: LoyaltyRepository,
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async execute(
    input: AdjustPointsManualInput,
  ): Promise<AdjustPointsManualOutput> {
    const { tenantId, userId, customerId, points, reason } = input;

    this.logger.log(
      `Executing manual points adjustment of ${points} points for customer ${customerId} (Tenant: ${tenantId})`,
    );

    if (points === 0) {
      throw new BadRequestException(
        'O valor de ajuste de pontos não pode ser zero.',
      );
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException(
        'A justificativa de auditoria deve conter pelo menos 10 caracteres.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Garante que exista um programa de fidelidade ativo ou configurado para o Tenant
      const program =
        await this.loyaltyRepository.findProgramByTenantId(tenantId);
      if (!program) {
        throw new BadRequestException(
          'O programa de fidelidade precisa estar configurado para o Tenant antes de realizar ajustes.',
        );
      }

      // 2. Busca a conta do cliente com trava de escrita para evitar race conditions
      let account =
        await this.loyaltyRepository.findAccountByCustomerIdForUpdate(
          tenantId,
          customerId,
          tx,
        );
      if (!account) {
        this.logger.log(
          `No loyalty account found for customer ${customerId}. Creating one dynamically.`,
        );
        account = LoyaltyAccount.create({
          tenantId,
          customerId,
          loyaltyProgramId: program.id.toString(),
          balance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
        });
      }

      // 3. Se for um ajuste de débito (pontos negativos), valida se o cliente possui saldo suficiente
      if (points < 0 && account.balance < Math.abs(points)) {
        throw new BadRequestException(
          `Saldo de pontos insuficiente para o débito administrativo solicitado. Saldo atual: ${account.balance} pts, Débito solicitado: ${Math.abs(points)} pts.`,
        );
      }

      const oldBalance = account.balance;

      // 4. Aplica o ajuste de saldo no domínio rico
      account.adjustPoints(points);

      // 5. Salva a conta
      await this.loyaltyRepository.saveAccount(account, tx);

      // 5.5 Registra o Log de Auditoria
      await this.auditLogsService.log(
        tenantId,
        userId,
        'LoyaltyAccount',
        account.id.toString(),
        AuditAction.UPDATE,
        {
          oldBalance,
          newBalance: account.balance,
          pointsAdjusted: points,
          reason,
        },
        tx,
      );

      // 6. Registra a transação de ajuste auditada no extrato imutável
      const transaction = LoyaltyTransaction.create({
        tenantId,
        accountId: account.id.toString(),
        type: 'ADJUST',
        points,
        reason,
        saleId: null, // Sem sale associada por ser um ajuste direto do Admin
      });
      await this.loyaltyRepository.saveTransaction(transaction, tx);

      this.logger.log(
        `Successfully adjusted customer ${customerId} balance by ${points} points. New balance: ${account.balance} pts. Justification recorded: "${reason}"`,
      );

      return {
        customerId,
        pointsAdjusted: points,
        newBalance: account.balance,
        reason,
        accountId: account.id.toString(),
      };
    });
  }
}
