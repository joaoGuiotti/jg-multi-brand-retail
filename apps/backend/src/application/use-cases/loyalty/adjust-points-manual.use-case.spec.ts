import { AdjustPointsManualUseCase } from './adjust-points-manual.use-case';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyProgram } from '../../../domain/entities/loyalty/loyalty-program.entity';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuditLogsService } from '../../../infrastructure/services/audit-logs.service';
import { BadRequestException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

describe('AdjustPointsManualUseCase', () => {
  let useCase: AdjustPointsManualUseCase;
  let mockRepository: jest.Mocked<LoyaltyRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockAuditLogsService: jest.Mocked<AuditLogsService>;

  beforeEach(() => {
    mockRepository = {
      saveProgram: jest.fn(),
      findProgramByTenantId: jest.fn(),
      saveAccount: jest.fn(),
      findAccountByCustomerId: jest.fn(),
      findAccountByCustomerIdForUpdate: jest.fn(),
      saveTransaction: jest.fn(),
      findTransactionsByAccountId: jest.fn(),
      findTransactionsBySaleId: jest.fn(),
    } as any;

    mockPrisma = {
      $transaction: jest.fn(async (cb) => {
        return await cb(mockPrisma);
      }),
    } as any;

    mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new AdjustPointsManualUseCase(
      mockRepository,
      mockPrisma,
      mockAuditLogsService,
    );
  });

  it('should reject adjustment if points is zero', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        userId: 'user-admin',
        customerId: 'customer-1',
        points: 0,
        reason: 'Justificativa de teste com dez caracteres',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject adjustment if reason is too short', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        userId: 'user-admin',
        customerId: 'customer-1',
        points: 100,
        reason: 'Curto', // 5 chars, needs 10
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject manual debit if points exceed balance', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01,
      minRedeemPoints: 100,
      maxDiscountPct: 50,
      active: true,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);

    const account = LoyaltyAccount.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      loyaltyProgramId: program.id.toString(),
      balance: 50, // customer has 50 points
      totalEarned: 50,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);

    // Operator requests manual debit of 100 points
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        userId: 'user-admin',
        customerId: 'customer-1',
        points: -100,
        reason: 'Debitando pontos incorretos',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should adjust positive points successfully', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01,
      minRedeemPoints: 100,
      maxDiscountPct: 50,
      active: true,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);

    const account = LoyaltyAccount.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      loyaltyProgramId: program.id.toString(),
      balance: 100,
      totalEarned: 100,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      userId: 'user-admin',
      customerId: 'customer-1',
      points: 50,
      reason: 'Ajuste manual de bonificação especial',
    });

    expect(result).toEqual({
      customerId: 'customer-1',
      pointsAdjusted: 50,
      newBalance: 150, // 100 + 50
      reason: 'Ajuste manual de bonificação especial',
      accountId: account.id.toString(),
    });

    expect(mockRepository.saveAccount).toHaveBeenCalledWith(
      account,
      mockPrisma,
    );
    expect(mockAuditLogsService.log).toHaveBeenCalledWith(
      'tenant-1',
      'user-admin',
      'LoyaltyAccount',
      account.id.toString(),
      AuditAction.UPDATE,
      {
        oldBalance: 100,
        newBalance: 150,
        pointsAdjusted: 50,
        reason: 'Ajuste manual de bonificação especial',
      },
      mockPrisma,
    );
    expect(mockRepository.saveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          type: 'ADJUST',
          points: 50,
          reason: 'Ajuste manual de bonificação especial',
        }),
      }),
      mockPrisma,
    );
  });

  it('should adjust negative points (debit) successfully', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01,
      minRedeemPoints: 100,
      maxDiscountPct: 50,
      active: true,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);

    const account = LoyaltyAccount.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      loyaltyProgramId: program.id.toString(),
      balance: 300,
      totalEarned: 300,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      userId: 'user-admin',
      customerId: 'customer-1',
      points: -100,
      reason: 'Ajuste de estorno de pontos',
    });

    expect(result).toEqual({
      customerId: 'customer-1',
      pointsAdjusted: -100,
      newBalance: 200, // 300 - 100
      reason: 'Ajuste de estorno de pontos',
      accountId: account.id.toString(),
    });

    expect(mockRepository.saveAccount).toHaveBeenCalledWith(
      account,
      mockPrisma,
    );
    expect(mockAuditLogsService.log).toHaveBeenCalledWith(
      'tenant-1',
      'user-admin',
      'LoyaltyAccount',
      account.id.toString(),
      AuditAction.UPDATE,
      {
        oldBalance: 300,
        newBalance: 200,
        pointsAdjusted: -100,
        reason: 'Ajuste de estorno de pontos',
      },
      mockPrisma,
    );
  });
});
