import { NotFoundException } from '@nestjs/common';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';
import { GetSaleUseCase } from '../get-sale.use-case';
import { ListSalesUseCase } from '../list-sales.use-case';

const makeItem = () =>
    SaleItem.create({ productId: 'p1', quantity: 1, unitPrice: 20, discount: 0, total: 20 });

const makeSale = (overrides: any = {}) =>
    Sale.create({ tenantId: 'tenant-1', userId: 'user-1', subtotal: 20, discount: 0, total: 20, status: 'PENDING', items: [makeItem()], ...overrides });

describe('GetSaleUseCase', () => {
    let useCase: GetSaleUseCase;
    let saleRepository: any;

    beforeEach(() => {
        saleRepository = { findById: jest.fn() };
        useCase = new GetSaleUseCase(saleRepository);
    });

    it('should throw NotFoundException if sale not found', async () => {
        saleRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ tenantId: 't', id: 's' })).rejects.toThrow(NotFoundException);
    });

    it('should return sale output when found', async () => {
        saleRepository.findById.mockResolvedValue(makeSale());
        const result = await useCase.execute({ tenantId: 'tenant-1', id: 's1' });
        expect(result.status).toBe('PENDING');
    });
});

describe('ListSalesUseCase', () => {
    let useCase: ListSalesUseCase;
    let saleRepository: any;

    beforeEach(() => {
        saleRepository = { findAll: jest.fn() };
        useCase = new ListSalesUseCase(saleRepository);
    });

    it('should return a paginated list of sales', async () => {
        saleRepository.findAll.mockResolvedValue({ data: [makeSale()], total: 1, page: 1, limit: 10, totalPages: 1 });
        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('should return empty list when no sales', async () => {
        saleRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
        const result = await useCase.execute({ tenantId: 'tenant-1', filters: {} });
        expect(result.data).toHaveLength(0);
    });
});
