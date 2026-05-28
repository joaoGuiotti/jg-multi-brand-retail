import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import {
  LoyaltyRepository,
  LoyaltyTransactionSearchResult,
} from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyProgram } from '../../../domain/entities/loyalty/loyalty-program.entity';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';
import {
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from '../../../domain/entities/loyalty/loyalty-transaction.entity';

@Injectable()
export class PrismaLoyaltyRepository implements LoyaltyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: any) {
    return tx ?? this.prisma;
  }

  private mapToProgramEntity(record: any): LoyaltyProgram {
    return LoyaltyProgram.create(
      {
        tenantId: record.tenantId ?? record.tenant_id,
        name: record.name,
        pointsPerReal: Number(record.pointsPerReal ?? record.points_per_real),
        redeemRatio: Number(record.redeemRatio ?? record.redeem_ratio),
        minRedeemPoints: record.minRedeemPoints ?? record.min_redeem_points,
        maxDiscountPct: Number(
          record.maxDiscountPct ?? record.max_discount_pct,
        ),
        expirationDays: record.expirationDays ?? record.expiration_days,
        active: record.active,
        createdAt: record.createdAt ?? record.created_at,
        updatedAt: record.updatedAt ?? record.updated_at,
      },
      new UniqueEntityID(record.id),
    );
  }

  private mapToAccountEntity(record: any): LoyaltyAccount {
    return LoyaltyAccount.create(
      {
        tenantId: record.tenantId ?? record.tenant_id,
        customerId: record.customerId ?? record.customer_id,
        loyaltyProgramId: record.loyaltyProgramId ?? record.loyalty_program_id,
        balance: record.balance,
        totalEarned: record.totalEarned ?? record.total_earned,
        totalRedeemed: record.totalRedeemed ?? record.total_redeemed,
        createdAt: record.createdAt ?? record.created_at,
      },
      new UniqueEntityID(record.id),
    );
  }

  private mapToTransactionEntity(record: any): LoyaltyTransaction {
    return LoyaltyTransaction.create(
      {
        tenantId: record.tenantId ?? record.tenant_id,
        accountId: record.accountId ?? record.account_id,
        type: record.type as LoyaltyTransactionType,
        points: record.points,
        saleId: record.saleId ?? record.sale_id,
        reason: record.reason,
        createdAt: record.createdAt ?? record.created_at,
      },
      new UniqueEntityID(record.id),
    );
  }

  async saveProgram(program: LoyaltyProgram): Promise<void> {
    const data = {
      tenantId: program.tenantId,
      name: program.name,
      pointsPerReal: program.pointsPerReal,
      redeemRatio: program.redeemRatio,
      minRedeemPoints: program.minRedeemPoints,
      maxDiscountPct: program.maxDiscountPct,
      expirationDays: program.expirationDays,
      active: program.active,
      updatedAt: program.updatedAt,
    };

    await this.prisma.loyaltyProgram.upsert({
      where: { tenantId: program.tenantId },
      create: {
        id: program.id.toString(),
        ...data,
      },
      update: data,
    });
  }

  async findProgramByTenantId(
    tenantId: string,
  ): Promise<LoyaltyProgram | null> {
    const record = await this.prisma.loyaltyProgram.findUnique({
      where: { tenantId },
    });

    if (!record) return null;

    return this.mapToProgramEntity(record);
  }

  async saveAccount(account: LoyaltyAccount, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    const data = {
      tenantId: account.tenantId,
      customerId: account.customerId,
      loyaltyProgramId: account.loyaltyProgramId,
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalRedeemed: account.totalRedeemed,
    };

    await client.loyaltyAccount.upsert({
      where: {
        tenantId_customerId: {
          tenantId: account.tenantId,
          customerId: account.customerId,
        },
      },
      create: {
        id: account.id.toString(),
        ...data,
      },
      update: data,
    });
  }

  async findAccountByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<LoyaltyAccount | null> {
    const record = await this.prisma.loyaltyAccount.findUnique({
      where: {
        tenantId_customerId: {
          tenantId,
          customerId,
        },
      },
    });

    if (!record) return null;

    return this.mapToAccountEntity(record);
  }

  async findAccountByCustomerIdForUpdate(
    tenantId: string,
    customerId: string,
    tx: any,
  ): Promise<LoyaltyAccount | null> {
    // Utiliza raw SQL com FOR UPDATE para travar a linha de saldo do cliente contra duplo resgate (race condition)
    const records = await tx.$queryRaw<any[]>`
      SELECT * FROM loyalty_accounts 
      WHERE tenant_id = ${tenantId} AND customer_id = ${customerId} 
      LIMIT 1 
      FOR UPDATE
    `;

    if (!records || records.length === 0) return null;

    return this.mapToAccountEntity(records[0]);
  }

  async saveTransaction(
    transaction: LoyaltyTransaction,
    tx?: any,
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.loyaltyTransaction.create({
      data: {
        id: transaction.id.toString(),
        tenantId: transaction.tenantId,
        accountId: transaction.accountId,
        type: transaction.type,
        points: transaction.points,
        saleId: transaction.saleId,
        reason: transaction.reason,
        createdAt: transaction.createdAt,
      },
    });
  }

  async findTransactionsByAccountId(
    tenantId: string,
    accountId: string,
    page: number,
    limit: number,
  ): Promise<LoyaltyTransactionSearchResult> {
    const where = { tenantId, accountId };

    const [total, records] = await Promise.all([
      this.prisma.loyaltyTransaction.count({ where }),
      this.prisma.loyaltyTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: records.map((record) => this.mapToTransactionEntity(record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTransactionsBySaleId(
    tenantId: string,
    saleId: string,
  ): Promise<LoyaltyTransaction[]> {
    const records = await this.prisma.loyaltyTransaction.findMany({
      where: { tenantId, saleId },
    });
    return records.map((record) => this.mapToTransactionEntity(record));
  }
}
