import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyTransaction } from '../../../domain/entities/loyalty/loyalty-transaction.entity';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

export interface RedeemPointsInput {
  tenantId: string;
  customerId: string;
  pointsToRedeem: number;
  saleId: string;
}

export interface RedeemPointsOutput {
  pointsRedeemed: number;
  discountApplied: number;
  newBalance: number;
  saleTotal: number;
  capped: boolean;
}

@Injectable()
export class RedeemPointsUseCase {
  private readonly logger = new Logger(RedeemPointsUseCase.name);

  constructor(
    private readonly loyaltyRepository: LoyaltyRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: RedeemPointsInput): Promise<RedeemPointsOutput> {
    const { tenantId, customerId, pointsToRedeem, saleId } = input;

    this.logger.log(
      `Redeeming ${pointsToRedeem} points for customer ${customerId} in sale ${saleId} (Tenant: ${tenantId})`,
    );

    // Executa tudo dentro de uma transação Prisma para controle ACID absoluto com FOR UPDATE locks
    return await this.prisma.$transaction(async (tx) => {
      // 1. Busca o programa de fidelidade do tenant
      const program =
        await this.loyaltyRepository.findProgramByTenantId(tenantId);
      if (!program || !program.active) {
        throw new BadRequestException(
          'Programa de fidelidade inativo ou não configurado para este estabelecimento.',
        );
      }

      // 2. Busca a conta de fidelidade com trava de escrita pessimista (FOR UPDATE)
      const account =
        await this.loyaltyRepository.findAccountByCustomerIdForUpdate(
          tenantId,
          customerId,
          tx,
        );
      if (!account) {
        throw new BadRequestException(
          'O cliente selecionado não possui uma conta de fidelidade ativa.',
        );
      }

      // 3. Busca a venda ativa correspondente
      const sale = await tx.sale.findUnique({
        where: { id: saleId, tenantId },
      });
      if (!sale) {
        throw new NotFoundException(`Venda ${saleId} não encontrada.`);
      }
      if (sale.status !== 'PENDING') {
        throw new BadRequestException(
          `Não é possível resgatar pontos em uma venda com status ${sale.status}.`,
        );
      }

      // 4. Calcula os limites de resgate e o teto de segurança
      const initialDiscountAmount = pointsToRedeem * program.redeemRatio;
      const maxDiscountAllowed =
        Number(sale.subtotal) * (program.maxDiscountPct / 100);

      let actualDiscount = initialDiscountAmount;
      let actualPointsToRedeem = pointsToRedeem;
      let capped = false;

      // Se o desconto exceder o teto, limita automaticamente e calcula os pontos equivalentes
      if (initialDiscountAmount > maxDiscountAllowed) {
        capped = true;
        actualDiscount = maxDiscountAllowed;

        // Converte o desconto máximo de volta para pontos (arredondando para cima para garantir cobertura)
        actualPointsToRedeem = Math.ceil(
          maxDiscountAllowed / program.redeemRatio,
        );

        // Recalcula o desconto final correspondente aos pontos inteiros
        actualDiscount = actualPointsToRedeem * program.redeemRatio;

        // Garante que não resgatará mais pontos do que solicitado originalmente
        if (actualPointsToRedeem > pointsToRedeem) {
          actualPointsToRedeem = pointsToRedeem;
          actualDiscount = actualPointsToRedeem * program.redeemRatio;
          capped = false; // Se caiu aqui, não está mais limitado pelo teto de segurança
        }
      }

      // 5. Valida o saldo de pontos na conta usando as regras de negócio ricas do domínio
      try {
        account.redeemPoints(actualPointsToRedeem, program.minRedeemPoints);
      } catch (err: any) {
        throw new BadRequestException(err.message);
      }

      // 6. Atualiza a conta e salva
      await this.loyaltyRepository.saveAccount(account, tx);

      // 7. Registra a transação de débito no extrato imutável (pontos negativos)
      const transaction = LoyaltyTransaction.create({
        tenantId,
        accountId: account.id.toString(),
        type: 'REDEEM',
        points: -actualPointsToRedeem,
        saleId,
        reason: `Resgate de cashback aplicado como desconto na venda ${saleId}`,
      });
      await this.loyaltyRepository.saveTransaction(transaction, tx);

      // 8. Atualiza a venda na base de dados aplicando o desconto de cashback
      const newDiscount = Number(sale.discount) + actualDiscount;
      const newTotal = Math.max(0, Number(sale.subtotal) - newDiscount);

      // Busca os pagamentos da venda para ver se a soma cobre o novo total
      const payments = await tx.payment.findMany({
        where: { saleId, tenantId },
      });
      const totalPaid = payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );
      const newStatus = totalPaid >= newTotal ? 'COMPLETED' : sale.status;

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          discount: newDiscount,
          total: newTotal,
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Successfully redeemed ${actualPointsToRedeem} points (R$ ${actualDiscount} discount) for customer ${customerId}. Capped: ${capped}`,
      );

      return {
        pointsRedeemed: actualPointsToRedeem,
        discountApplied: actualDiscount,
        newBalance: account.balance,
        saleTotal: Number(updatedSale.total),
        capped,
      };
    });
  }
}
