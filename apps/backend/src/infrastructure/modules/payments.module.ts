import { Module } from '@nestjs/common';
import { CancelPaymentUseCase } from '../../application/use-cases/payments/cancel-payment.use-case';
import { CreatePaymentUseCase } from '../../application/use-cases/payments/create-payment.use-case';
import { GetPaymentUseCase } from '../../application/use-cases/payments/get-payment.use-case';
import { GetSalePaymentsUseCase } from '../../application/use-cases/payments/get-sale-payments.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/payments/list-payments.use-case';
import { PaymentRepository } from '../../domain/repositories/payment-repository';
import { PaymentsController } from '../controllers/payments.controller';
import { PrismaPaymentRepository } from '../persistence/repositories/prisma-payment.repository';
import { PrismaModule } from './prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentsController],
    providers: [
        {
            provide: PaymentRepository,
            useClass: PrismaPaymentRepository,
        },
        CreatePaymentUseCase,
        CancelPaymentUseCase,
        ListPaymentsUseCase,
        GetPaymentUseCase,
        GetSalePaymentsUseCase,
    ],
    exports: [
        PaymentRepository,
        CreatePaymentUseCase,
        CancelPaymentUseCase,
        ListPaymentsUseCase,
        GetPaymentUseCase,
        GetSalePaymentsUseCase,
    ],
})
export class PaymentsModule { }
