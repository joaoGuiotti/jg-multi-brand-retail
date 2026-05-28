import { EarnPointsUseCase } from './earn-points.use-case';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyProgram } from '../../../domain/entities/loyalty/loyalty-program.entity';
import { LoyaltyAccount } from '../../../domain/entities/loyalty/loyalty-account.entity';

describe('EarnPointsUseCase', () => {
  let useCase: EarnPointsUseCase;
  let mockRepository: jest.Mocked<LoyaltyRepository>;

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

    useCase = new EarnPointsUseCase(mockRepository);
  });

  it('should not earn points if program is not found', async () => {
    mockRepository.findProgramByTenantId.mockResolvedValue(null);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      saleId: 'sale-1',
      liquidAmount: 100,
    });

    expect(result).toBeNull();
    expect(mockRepository.saveAccount).not.toHaveBeenCalled();
  });

  it('should not earn points if program is inactive', async () => {
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

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      saleId: 'sale-1',
      liquidAmount: 100,
    });

    expect(result).toBeNull();
    expect(mockRepository.saveAccount).not.toHaveBeenCalled();
  });

  it('should earn points using floor rounding logic', async () => {
    // 1.5 points per real
    const program = LoyaltyProgram.create({
      tenantId: 'tenant-1',
      name: 'Test',
      pointsPerReal: 1.5,
      redeemRatio: 0.01,
      minRedeemPoints: 100,
      maxDiscountPct: 50,
      active: true,
      expirationDays: null,
    });
    mockRepository.findProgramByTenantId.mockResolvedValue(program);
    mockRepository.findAccountByCustomerId.mockResolvedValue(null); // No existing account

    // 10.50 * 1.5 = 15.75 points. With floor rounding it should be 15 points.
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      saleId: 'sale-1',
      liquidAmount: 10.5,
    });

    expect(result).not.toBeNull();
    expect(result!.pointsEarned).toBe(15);
    expect(result!.newBalance).toBe(15);
    expect(mockRepository.saveAccount).toHaveBeenCalled();
    expect(mockRepository.saveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          type: 'EARN',
          points: 15,
          saleId: 'sale-1',
        }),
      }),
    );
  });

  it('should earn points and add to existing account balance', async () => {
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

    const existingAccount = LoyaltyAccount.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      loyaltyProgramId: program.id.toString(),
      balance: 120,
      totalEarned: 220,
      totalRedeemed: 100,
    });
    mockRepository.findAccountByCustomerId.mockResolvedValue(existingAccount);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      saleId: 'sale-1',
      liquidAmount: 80.5, // 80.5 * 1.0 = 80.5 -> floor rounded is 80 points
    });

    expect(result).not.toBeNull();
    expect(result!.pointsEarned).toBe(80);
    expect(result!.newBalance).toBe(200); // 120 + 80
    expect(mockRepository.saveAccount).toHaveBeenCalled();
  });
});
