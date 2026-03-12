import { GenerateSalesHistoryReportUseCase } from '../generate-sales-history-report.use-case';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';

const makeItem = () =>
    SaleItem.create({ productId: 'p1', quantity: 1, unitPrice: 20, discount: 0, total: 20 });

const makeSale = (overrides: any = {}) =>
    Sale.create({ userId: 'user-1', subtotal: 20, discount: 0, total: 20, status: 'COMPLETED', items: [makeItem()], ...overrides });

describe('GenerateSalesHistoryReportUseCase', () => {
    let useCase: GenerateSalesHistoryReportUseCase;
    let tenantRepository: any;
    let saleRepository: any;
    let pdfService: any;

    beforeEach(() => {
        tenantRepository = { findById: jest.fn() };
        saleRepository = { findAll: jest.fn() };
        pdfService = { generateList: jest.fn() };
        useCase = new GenerateSalesHistoryReportUseCase(tenantRepository, saleRepository, pdfService);
    });

    it('should generate a PDF report with sales data', async () => {
        const tenant = { id: 't1', name: 'Test Store', logoUrl: 'http://logo.com' };
        const sales = [makeSale({ id: 's1' }), makeSale({ id: 's2', status: 'CANCELLED' })];
        
        tenantRepository.findById.mockResolvedValue(tenant);
        saleRepository.findAll.mockResolvedValue({ data: sales, total: 2 });
        pdfService.generateList.mockResolvedValue(Buffer.from('pdf-content'));

        const result = await useCase.execute({ tenantId: 't1' });

        expect(tenantRepository.findById).toHaveBeenCalledWith('t1');
        expect(saleRepository.findAll).toHaveBeenCalledWith('t1', expect.objectContaining({
            limit: 1000,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }));
        expect(pdfService.generateList).toHaveBeenCalled();
        expect(result).toEqual(Buffer.from('pdf-content'));
    });

    it('should handle zero sales correctly', async () => {
        tenantRepository.findById.mockResolvedValue({ id: 't1', name: 'Test Store' });
        saleRepository.findAll.mockResolvedValue({ data: [], total: 0 });
        pdfService.generateList.mockResolvedValue(Buffer.from('empty-report'));

        const result = await useCase.execute({ tenantId: 't1' });

        expect(result).toEqual(Buffer.from('empty-report'));
    });
});
