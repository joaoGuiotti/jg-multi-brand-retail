import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from '../../application/use-cases/customers/create-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/use-cases/customers/delete-customer.use-case';
import { GetCustomerUseCase } from '../../application/use-cases/customers/get-customer.use-case';
import { ListCustomersUseCase } from '../../application/use-cases/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/customers/update-customer.use-case';
import { CustomerRepository } from '../../domain/repositories/customer-repository';
import { CustomersController } from '../controllers/customers.controller';
import { PrismaCustomerRepository } from '../persistence/repositories/prisma-customer.repository';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController],
  providers: [
    {
      provide: CustomerRepository,
      useClass: PrismaCustomerRepository,
    },
    CreateCustomerUseCase,
    ListCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
  exports: [
    CustomerRepository,
    CreateCustomerUseCase,
    ListCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
})
export class CustomersModule {}
