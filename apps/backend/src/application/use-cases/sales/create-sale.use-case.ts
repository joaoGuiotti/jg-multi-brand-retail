import { UseCase } from '@common/application/use-case.interface';
import {
  Payment,
  PaymentMethod,
} from '@domain/entities/payments/payment.entity';
import { Sale, SaleItem } from '@domain/entities/sales/sale.entity';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { ProductRepository } from '@domain/repositories/product-repository';
import { SaleRepository } from '@domain/repositories/sale-repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { DomainEventPublisher } from '@common/application/domain-event-publisher';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type CreateSaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type CreateSaleInput = {
  tenantId: string;
  userId: string;
  customerId?: string;
  items: CreateSaleItemInput[];
  discount?: number;
  payments?: {
    method: string;
    amount: number;
    installments?: number;
    fee?: number;
  }[];
};

@Injectable()
export class CreateSaleUseCase implements UseCase<CreateSaleInput, SaleOutput> {
  private readonly logger = new Logger(CreateSaleUseCase.name);

  constructor(
    private saleRepository: SaleRepository,
    private productRepository: ProductRepository,
    private paymentRepository: PaymentRepository,
    private prisma: PrismaService,
    private eventPublisher: DomainEventPublisher,
  ) { }

  async execute(input: CreateSaleInput): Promise<SaleOutput> {
    const {
      tenantId,
      userId,
      customerId,
      items: itemsInput,
      discount: saleDiscount,
    } = input;

    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }
    }
    const items: SaleItem[] = [];
    let subtotal = 0;
    const modifiedProducts: any[] = [];

    for (const itemDto of itemsInput) {
      const product = await this.productRepository.findById(
        tenantId,
        itemDto.productId,
      );

      if (!product) {
        throw new NotFoundException(`Product ${itemDto.productId} not found`);
      }

      if (!product.active) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }

      if (product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`,
        );
      }

      const itemSubtotal = itemDto.unitPrice * itemDto.quantity;
      const itemDiscount = itemDto.discount || 0;
      const itemTotal = itemSubtotal - itemDiscount;
      subtotal += itemTotal;

      items.push(
        SaleItem.create({
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          discount: itemDiscount,
          total: itemTotal,
        }),
      );

      product.adjustStock(-itemDto.quantity, tenantId, 'EXIT');
      await this.productRepository.update(tenantId, product);
      modifiedProducts.push(product);
    }

    const discount = saleDiscount || 0;
    const total = subtotal - discount;

    const sale = Sale.create({
      userId,
      customerId,
      subtotal,
      discount,
      total,
      status: 'PENDING',
      items,
    });

    // Handle payments and status
    let totalCashPaid = 0;
    const paymentsToCreate: Payment[] = [];

    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        const payment = Payment.create({
          saleId: sale.id.toString(),
          method: p.method as PaymentMethod,
          amount: p.amount,
          installments: p.installments || 1,
          fee: p.fee || 0,
          status: 'PAID',
        });
        paymentsToCreate.push(payment);

        if (payment.method === 'CASH') {
          totalCashPaid += payment.amount;
        }
      }

      const hasOnlyCashPayments = input.payments.every(
        (p) => p.method === 'CASH',
      );

      if (hasOnlyCashPayments && totalCashPaid >= total) {
        sale.complete(totalCashPaid, tenantId);
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const createdSale = await this.saleRepository.create(tenantId, sale);

      for (const payment of paymentsToCreate) {
        await this.paymentRepository.create(tenantId, payment);
      }

      return createdSale;
    });

    // Publish domain events
    for (const product of modifiedProducts) {
      await this.eventPublisher.publishEvents(product);
    }
    await this.eventPublisher.publishEvents(sale);

    return SaleOutputMapper.toOutput(created, tenantId);
  }
}
