import { NotFoundException } from '@nestjs/common';
import { GenerateSaleReceiptUseCase } from '../generate-sale-receipt.use-case';
import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';

const makeItem = () =>
  SaleItem.create({
    productId: 'p1',
    product: { name: 'Camiseta Silk', sku: 'CAM-001' },
    quantity: 2,
    unitPrice: 50,
    discount: 0,
    total: 100,
  });

const makeSale = (overrides: any = {}) =>
  Sale.create({
    userId: 'user-1',
    invoiceNumber: 'INV-1001',
    customerName: 'João Silva',
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'COMPLETED',
    items: [makeItem()],
    ...overrides,
  });

describe('GenerateSaleReceiptUseCase', () => {
  let useCase: GenerateSaleReceiptUseCase;
  let tenantRepository: any;
  let saleRepository: any;
  let pdfService: any;
  let mockPdfBuilder: any;

  beforeEach(() => {
    tenantRepository = { findById: jest.fn() };
    saleRepository = { findById: jest.fn() };
    mockPdfBuilder = {
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf-receipt-content')),
    };
    pdfService = {
      generateReceipt: jest.fn().mockResolvedValue(mockPdfBuilder),
    };
    useCase = new GenerateSaleReceiptUseCase(
      saleRepository,
      tenantRepository,
      pdfService,
    );
  });

  it('should generate a PDF receipt including return orders and items', async () => {
    const tenant = { id: 't1', name: 'Loja Exemplo', logoUrl: 'http://logo.com' };
    const sale = makeSale({
      returns: [
        {
          id: 'ret-1',
          status: 'REFUNDED',
          refundType: 'CASH_REFUND',
          reason: 'Defeito de fábrica',
          totalRefund: 50,
          createdAt: new Date(),
          items: [
            {
              id: 'ret-item-1',
              productId: 'p1',
              quantity: 1,
              unitPrice: 50,
              total: 50,
              condition: 'DEFECTIVE',
              product: { name: 'Camiseta Silk', sku: 'CAM-001' },
            },
          ],
        },
      ],
    });

    tenantRepository.findById.mockResolvedValue(tenant);
    saleRepository.findById.mockResolvedValue(sale);

    const result = await useCase.execute({ tenantId: 't1', id: 's1' });

    expect(saleRepository.findById).toHaveBeenCalledWith('t1', 's1');
    expect(tenantRepository.findById).toHaveBeenCalledWith('t1');
    expect(pdfService.generateReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'Loja Exemplo',
        invoiceNumber: 'INV-1001',
        customerName: 'João Silva',
        subtotal: 100,
        total: 100,
        returns: expect.arrayContaining([
          expect.objectContaining({
            id: 'ret-1',
            status: 'REFUNDED',
            refundType: 'CASH_REFUND',
            reason: 'Defeito de fábrica',
            total: 50,
            items: expect.arrayContaining([
              expect.objectContaining({
                name: 'Camiseta Silk',
                sku: 'CAM-001',
                quantity: 1,
                unitPrice: 50,
                total: 50,
                condition: 'DEFECTIVE',
              }),
            ]),
          }),
        ]),
      }),
    );
    expect(mockPdfBuilder.toBuffer).toHaveBeenCalled();
    expect(result).toEqual(Buffer.from('pdf-receipt-content'));
  });

  it('should throw NotFoundException if sale is not found', async () => {
    tenantRepository.findById.mockResolvedValue({ id: 't1', name: 'Loja' });
    saleRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ tenantId: 't1', id: 'non-existing' }),
    ).rejects.toThrow(NotFoundException);
  });
});
