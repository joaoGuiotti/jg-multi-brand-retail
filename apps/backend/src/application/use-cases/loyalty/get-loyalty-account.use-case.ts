import { Injectable, Logger } from '@nestjs/common';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';

export interface GetLoyaltyAccountInput {
  tenantId: string;
  customerId: string;
}

export interface GetLoyaltyAccountOutput {
  id: string;
  customerId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  createdAt: Date;
  transactions: {
    id: string;
    type: string;
    points: number;
    saleId: string | null;
    reason: string | null;
    createdAt: Date;
  }[];
}

@Injectable()
export class GetLoyaltyAccountUseCase {
  private readonly logger = new Logger(GetLoyaltyAccountUseCase.name);

  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async execute(
    input: GetLoyaltyAccountInput,
  ): Promise<GetLoyaltyAccountOutput> {
    const { tenantId, customerId } = input;

    this.logger.log(
      `Fetching loyalty account for customer ${customerId} (Tenant: ${tenantId})`,
    );

    const account = await this.loyaltyRepository.findAccountByCustomerId(
      tenantId,
      customerId,
    );

    if (!account) {
      this.logger.log(
        `No loyalty account found for customer ${customerId}. Returning empty baseline.`,
      );
      return {
        id: '',
        customerId,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        createdAt: new Date(),
        transactions: [],
      };
    }

    // Busca o extrato de transações de forma paginada (primeiras 50 transações)
    const txsResult = await this.loyaltyRepository.findTransactionsByAccountId(
      tenantId,
      account.id.toString(),
      1,
      50,
    );

    return {
      id: account.id.toString(),
      customerId: account.customerId,
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalRedeemed: account.totalRedeemed,
      createdAt: account.createdAt ?? new Date(),
      transactions: txsResult.data.map((tx) => ({
        id: tx.id.toString(),
        type: tx.type,
        points: tx.points,
        saleId: tx.saleId ?? null,
        reason: tx.reason ?? null,
        createdAt: tx.createdAt ?? new Date(),
      })),
    };
  }
}
