import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { provideTransformInterceptor } from './infrastructure/interceptors/transform/transform-interceptor.provider';
import { AuthModule } from './infrastructure/modules/auth.module';
import { ConfigModule } from './infrastructure/modules/config.module';
import { CustomersModule } from './infrastructure/modules/customers.module';
import { DevModule } from './infrastructure/modules/dev.module';
import { InventoryModule } from './infrastructure/modules/inventory.module';
import { PaymentsModule } from './infrastructure/modules/payments.module';
import { PrismaModule } from './infrastructure/modules/prisma.module';
import { ProductsModule } from './infrastructure/modules/products.module';
import { SalesModule } from './infrastructure/modules/sales.module';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    InventoryModule,
    CustomersModule,
    ...(isDev ? [DevModule] : []),
  ],
  controllers: [],
  providers: [
    provideTransformInterceptor()
  ],
})
export class AppModule { }
