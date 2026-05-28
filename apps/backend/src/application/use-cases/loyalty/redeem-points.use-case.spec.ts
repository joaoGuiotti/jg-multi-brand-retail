import { RedeemPointsUseCase } from './redeem-points.use-case';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyProgram } from '../../../domain/entities/loyalty/loyalty-program.entity';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RedeemPointsUseCase', () => {
  let useCase: RedeemPointsUseCase;
  let mockRepository: jest.Mocked<LoyaltyRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockRepository = {
      saveProgram: jest.fn(),
      findProgramByTenantId: jest.fn(),
      saveAccount: jest.fn(),
      findAccountByCustomerId: jest.fn(),
      findAccountByCustomerIdForUpdate: jest.fn(),
      saveTransaction: jest.fn(),
      findTransactionsByAccountId: jest.fn(),
    } as any;

    // Mock Prisma's transaction and other database calls
    mockPrisma = {
      $transaction: jest.fn(async (cb) => {
        return await cb(mockPrisma);
      }),
      sale: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    useCase = new RedeemPointsUseCase(mockRepository, mockPrisma);
  });

  it('should reject redemption if program is inactive', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01,
      minRedeemPoints: 100,
      maxDiscountPct: 50,
      active: false,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        pointsToRedeem: 200,
        saleId: 'sale-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject redemption if customer loyalty account is not found', async () => {
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
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        pointsToRedeem: 200,
        saleId: 'sale-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject redemption if sale is not found', async () => {
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
      balance: 500,
      totalEarned: 500,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);
    (mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        pointsToRedeem: 200,
        saleId: 'sale-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should redeem points successfully within limits (Happy Path)', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01, // 100 points = R$ 1.00
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
      balance: 500, // R$ 5.00 cashback
      totalEarned: 500,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);

    const mockSale = {
      id: 'sale-1',
      tenantId: 'tenant-1',
      subtotal: 100.0, // 50% max discount = R$ 50.00
      discount: 0.0,
      total: 100.0,
      status: 'PENDING',
    };
    (mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale);

    const updatedSale = {
      ...mockSale,
      discount: 2.0, // 200 points redeemed = R$ 2.00
      total: 98.0,
    };
    (mockPrisma.sale.update as jest.Mock).mockResolvedValue(updatedSale);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      pointsToRedeem: 200, // R$ 2.00 discount requested
      saleId: 'sale-1',
    });

    expect(result).toEqual({
      pointsRedeemed: 200,
      discountApplied: 2,
      newBalance: 300, // 500 - 200
      saleTotal: 98,
      capped: false,
    });

    expect(mockRepository.saveAccount).toHaveBeenCalledWith(
      account,
      mockPrisma,
    );
    expect(mockRepository.saveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          type: 'REDEEM',
          points: -200,
          saleId: 'sale-1',
        }),
      }),
      mockPrisma,
    );
  });

  it('should cap the discount and point redemption to the safety threshold', async () => {
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.0,
      redeemRatio: 0.01, // 100 points = R$ 1.00
      minRedeemPoints: 100,
      maxDiscountPct: 50, // 50% max discount
      active: true,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);

    const account = LoyaltyAccount.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      loyaltyProgramId: program.id.toString(),
      balance: 10000, // R$ 100.00 balance
      totalEarned: 10000,
      totalRedeemed: 0,
    });
    mockRepository.findAccountByCustomerIdForUpdate.mockResolvedValue(account);

    const mockSale = {
      id: 'sale-1',
      tenantId: 'tenant-1',
      subtotal: 50.0, // Max allowed discount is 50% of R$ 50.00 = R$ 25.00 (which corresponds to 2500 points)
      discount: 0.0,
      total: 50.0,
      status: 'PENDING',
    };
    (mockPrisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale);

    const updatedSale = {
      ...mockSale,
      discount: 25.0,
      total: 25.0,
    };
    (mockPrisma.sale.update as jest.Mock).mockResolvedValue(updatedSale);

    // Operator requests to redeem 6000 points (R$ 60.00), which exceeds R$ 25.00 limit.
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      pointsToRedeem: 6000,
      saleId: 'sale-1',
    });

    expect(result).toEqual({
      pointsRedeemed: 2500, // Capped to 2500 points (R$ 25.00)
      discountApplied: 25.0,
      newBalance: 7500, // 10000 - 2500
      saleTotal: 25.0,
      capped: true,
    });
  });
});
