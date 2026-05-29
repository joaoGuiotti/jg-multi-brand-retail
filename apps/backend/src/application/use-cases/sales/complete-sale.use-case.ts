import { DomainEventPublisher } from '../../../common/application/domain-event-publisher';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type CompleteSaleInput = { tenantId: string; id: string };

@Injectable()
export class CompleteSaleUseCase implements UseCase<
  CompleteSaleInput,
  SaleOutput
> {
  private readonly logger = new Logger(CompleteSaleUseCase.name);

  constructor(
    private saleRepository: SaleRepository,
    private prisma: PrismaService,
    private eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: CompleteSaleInput): Promise<SaleOutput> {
    const { tenantId, id } = input;
    const sale = await this.saleRepository.findById(tenantId, id);

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const payments = await this.prisma.payment.findMany({
      where: { saleId: id, tenantId },
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    try {
      sale.complete(totalPaid, tenantId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Mark pending payments as PAID
      await tx.payment.updateMany({
        where: { saleId: id, tenantId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // Mark pending receivables as PAID
      await tx.financialAccount.updateMany({
        where: { saleId: id, tenantId, type: 'RECEIVABLE', status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });

      return await this.saleRepository.update(tenantId, sale);
    });

    await this.eventPublisher.publishEvents(sale);

    return SaleOutputMapper.toOutput(updated, tenantId);
  }
}
