import { GetCommissionRateUseCase } from '../get-commission-rate.use-case';
import { NotFoundException } from '@nestjs/common';

describe('GetCommissionRateUseCase', () => {
  let useCase: GetCommissionRateUseCase;
  let tenantRepository: any;

  beforeEach(() => {
    tenantRepository = {
      findById: jest.fn(),
    };
    useCase = new GetCommissionRateUseCase(tenantRepository);
  });

  it('should return the commission rate of the tenant', async () => {
    tenantRepository.findById.mockResolvedValue({ commissionRate: 5 });
    const result = await useCase.execute({ tenantId: 'tenant-1' });
    expect(result).toEqual({ commissionRate: 5 });
  });

  it('should return 0 if the tenant has no commission rate', async () => {
    tenantRepository.findById.mockResolvedValue({ commissionRate: null });
    const result = await useCase.execute({ tenantId: 'tenant-1' });
    expect(result).toEqual({ commissionRate: 0 });
  });

  it('should throw NotFoundException if tenant not found', async () => {
    tenantRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute({ tenantId: 'tenant-1' })).rejects.toThrow(NotFoundException);
  });
});
