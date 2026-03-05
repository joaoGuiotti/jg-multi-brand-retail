import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { SaleRepository } from '../../../domain/repositories/sale-repository';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

export type CompleteSaleInput = { tenantId: string; id: string };

@Injectable()
export class CompleteSaleUseCase implements UseCase<CompleteSaleInput, SaleOutput> {
    constructor(
        private saleRepository: SaleRepository,
        private prisma: PrismaService,
    ) { }

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
            sale.complete(totalPaid);
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }

        const updated = await this.saleRepository.update(tenantId, sale);
        return SaleOutputMapper.toOutput(updated, tenantId);
    }
}
