import { UpdateCommissionRateUseCase } from '../update-commission-rate.use-case';
import { NotFoundException } from '@nestjs/common';

describe('UpdateCommissionRateUseCase', () => {
  let useCase: UpdateCommissionRateUseCase;
  let tenantRepository: any;

  beforeEach(() => {
    tenantRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    useCase = new UpdateCommissionRateUseCase(tenantRepository);
  });

  it('should update the commission rate of the tenant', async () => {
    const mockTenant = { id: 'tenant-1', updateCommissionRate: jest.fn(), commissionRate: 10 };
    tenantRepository.findById.mockResolvedValue(mockTenant);
    tenantRepository.update.mockResolvedValue(mockTenant);
    
    const result = await useCase.execute({ tenantId: 'tenant-1', commissionRate: 10 });
    
    expect(tenantRepository.update).toHaveBeenCalledWith(expect.objectContaining({ commissionRate: 10 }));
    expect(result).toEqual({ success: true, commissionRate: 10 });
  });

  it('should throw NotFoundException if tenant not found', async () => {
    tenantRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute({ tenantId: 'tenant-1', commissionRate: 10 })).rejects.toThrow(NotFoundException);
  });
});
