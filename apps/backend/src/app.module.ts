import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
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

import { NotificationsModule } from './infrastructure/modules/notifications.module';
import { DashboardModule } from './infrastructure/modules/dashboard.module';
import { ReturnsModule } from './infrastructure/modules/returns.module';
import { LoyaltyModule } from './infrastructure/modules/loyalty.module';
import { FinanceModule } from './infrastructure/modules/finance.module';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CustomThrottlerGuard } from './infrastructure/guards/custom-throttler.guard';
import { ConfigService } from '@nestjs/config';

import { HealthController } from './infrastructure/controllers/health.controller';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        let storage: any = undefined;
        if (redisUrl && redisUrl.startsWith('redis://')) {
          try {
            storage = new ThrottlerStorageRedisService(redisUrl);
          } catch {
            storage = undefined;
          }
        }
        return {
          throttlers: [
            {
              name: 'default',
              ttl: seconds(60),
              limit: 100,
            },
          ],
          storage,
        };
      },
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    InventoryModule,
    CustomersModule,
    NotificationsModule,
    DashboardModule,
    ReturnsModule,
    LoyaltyModule,
    FinanceModule,
    ...(isDev ? [DevModule] : []),
  ],
  controllers: [HealthController],
  providers: [
    provideTransformInterceptor(),
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
