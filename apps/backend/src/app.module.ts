import { Module } from '@nestjs/common';
import { provideTransformInterceptor } from './infrastructure/interceptors/transform/transform-interceptor.provider';
import { AuthModule } from './infrastructure/modules/auth.module';
import { ConfigModule } from './infrastructure/modules/config.module';
import { InventoryModule } from './infrastructure/modules/inventory.module';
import { PaymentsModule } from './infrastructure/modules/payments.module';
import { PrismaModule } from './infrastructure/modules/prisma.module';
import { ProductsModule } from './infrastructure/modules/products.module';
import { SalesModule } from './infrastructure/modules/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    InventoryModule,
  ],
  controllers: [],
  providers: [
    provideTransformInterceptor()
  ],
})
export class AppModule { }
