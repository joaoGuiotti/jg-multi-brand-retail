import { Injectable, Logger } from '@nestjs/common';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';
import { LoyaltyTransaction } from '../../../domain/entities/loyalty/loyalty-transaction.entity';

export interface EarnPointsInput {
  tenantId: string;
  customerId: string;
  saleId: string;
  liquidAmount: number;
}

export interface EarnPointsOutput {
  pointsEarned: number;
  newBalance: number;
  accountId: string;
}

@Injectable()
export class EarnPointsUseCase {
  private readonly logger = new Logger(EarnPointsUseCase.name);

  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async execute(input: EarnPointsInput): Promise<EarnPointsOutput | null> {
    const { tenantId, customerId, saleId, liquidAmount } = input;

    this.logger.log(
      `Executing EarnPoints for customer ${customerId} under tenant ${tenantId}. Sale: ${saleId}, amount: R$ ${liquidAmount}`,
    );

    // 1. Busca o programa de fidelidade do tenant
    const program =
      await this.loyaltyRepository.findProgramByTenantId(tenantId);
    if (!program || !program.active) {
      this.logger.log(
        `Loyalty program is not active or not configured for tenant ${tenantId}. Skipping point accumulation.`,
      );
      return null;
    }

    // 2. Calcula os pontos baseados no valor líquido pago e fator de acúmulo
    // Regra: arredondamento para baixo (floor rounding)
    const pointsToEarn = Math.floor(liquidAmount * program.pointsPerReal);
    if (pointsToEarn <= 0) {
      this.logger.log(
        `Calculated points to earn is zero or negative (${pointsToEarn}). Skipping.`,
      );
      return null;
    }

    // 3. Busca a conta de fidelidade do cliente ou cria uma nova se não existir
    let account = await this.loyaltyRepository.findAccountByCustomerId(
      tenantId,
      customerId,
    );
    if (!account) {
      this.logger.log(
        `No loyalty account found for customer ${customerId}. Creating a new one automatically.`,
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

    // 4. Executa a regra ricos do domínio de acúmulo
    account.earnPoints(pointsToEarn);

    // 5. Cria o registro de transação imutável no extrato
    const transaction = LoyaltyTransaction.create({
      tenantId,
      accountId: account.id.toString(),
      type: 'EARN',
      points: pointsToEarn,
      saleId,
      reason: `Acúmulo por compra no PDV (Venda: ${saleId})`,
    });

    // 6. Persiste as mudanças
    await this.loyaltyRepository.saveAccount(account);
    await this.loyaltyRepository.saveTransaction(transaction);

    this.logger.log(
      `Earned ${pointsToEarn} points for customer ${customerId}. New balance is ${account.balance}.`,
    );

    return {
      pointsEarned: pointsToEarn,
      newBalance: account.balance,
      accountId: account.id.toString(),
    };
  }

  async reversePoints(
    tenantId: string,
    customerId: string,
    saleId: string,
  ): Promise<void> {
    this.logger.log(
      `Reversing points for customer ${customerId}, sale ${saleId} (Tenant: ${tenantId})`,
    );

    // 1. Busca a conta do cliente
    const account = await this.loyaltyRepository.findAccountByCustomerId(
      tenantId,
      customerId,
    );
    if (!account) {
      this.logger.warn(
        `No loyalty account found for customer ${customerId} to reverse points.`,
      );
      return;
    }

    // 2. Busca todas as transações associadas a esta venda
    const transactions = await this.loyaltyRepository.findTransactionsBySaleId(
      tenantId,
      saleId,
    );

    // 3. Filtra a transação de ganho (EARN)
    const earnTx = transactions.find((t) => t.type === 'EARN');
    if (!earnTx) {
      this.logger.log(
        `No 'EARN' transactions found for sale ${saleId}. Skipping reversal.`,
      );
      return;
    }

    const pointsToReverse = earnTx.points;
    if (pointsToReverse <= 0) {
      this.logger.log(
        `Earned points for sale ${saleId} is ${pointsToReverse}, nothing to reverse.`,
      );
      return;
    }

    // 4. Evita duplo estorno defensivamente
    const reversalTxExists = transactions.some(
      (t) =>
        t.type === 'ADJUST' &&
        t.points === -pointsToReverse &&
        t.reason?.includes('Estorno automático'),
    );
    if (reversalTxExists) {
      this.logger.log(
        `Reversal already processed for sale ${saleId}. Skipping to prevent duplicate reversal.`,
      );
      return;
    }

    // 5. Executa a lógica rica do domínio
    account.reversePoints(pointsToReverse);

    // 6. Registra a transação de estorno automático no extrato imutável
    const transaction = LoyaltyTransaction.create({
      tenantId,
      accountId: account.id.toString(),
      type: 'ADJUST',
      points: -pointsToReverse,
      saleId,
      reason: `Estorno automático por devolução da venda ${saleId}`,
    });

    // 7. Salva a conta e a nova transação
    await this.loyaltyRepository.saveAccount(account);
    await this.loyaltyRepository.saveTransaction(transaction);

    this.logger.log(
      `Successfully reversed ${pointsToReverse} points for customer ${customerId}. New balance: ${account.balance} pts.`,
    );
  }
}
