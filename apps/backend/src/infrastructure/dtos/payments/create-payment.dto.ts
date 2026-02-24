import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

// Match Prisma PaymentMethod enum values
export enum PaymentMethod {
    PIX = 'PIX',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    CASH = 'CASH',
    BOLETO = 'BOLETO',
    STORE_CREDIT = 'STORE_CREDIT',
}

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    saleId: string;

    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsNumber()
    @Min(1)
    installments: number = 1;

    @IsNumber()
    @Min(0)
    fee: number = 0;
}
