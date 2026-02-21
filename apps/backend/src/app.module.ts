import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { provideTransformInterceptor } from './common/interceptors/transform-interceptor.provider';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
