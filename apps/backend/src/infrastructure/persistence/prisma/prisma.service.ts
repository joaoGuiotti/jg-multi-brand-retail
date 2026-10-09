import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private configService: ConfigService,
    private cls: ClsService,
  ) {
    const connectionString = configService.get<string>('DB_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    // Safety Net para Multi-Tenant:
    // O $use foi completamente removido do Prisma 7+. Utilizamos $extends combinado com um Proxy
    // para preservar os hooks de ciclo de vida do NestJS (OnModuleInit) e manter a injeção do ClsService.
    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = cls.get('tenantId');
            const modelsWithoutTenantId = [
              'Tenant',
              'SaleItem',
              'ConditionalItem',
              'ReturnItem',
            ];

            if (tenantId && model && !modelsWithoutTenantId.includes(model)) {
              const anyArgs = (args as any) || {};
              if (
                operation.startsWith('find') ||
                operation.startsWith('update') ||
                operation.startsWith('delete') ||
                operation === 'count'
              ) {
                anyArgs.where = anyArgs.where || {};
                if (anyArgs.where.tenantId === undefined) {
                  anyArgs.where.tenantId = tenantId;
                }
              }
              if (operation === 'create' || operation === 'createMany') {
                anyArgs.data = anyArgs.data || {};
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data.forEach((d: any) => {
                    if (d.tenantId === undefined) d.tenantId = tenantId;
                  });
                } else {
                  if (anyArgs.data.tenantId === undefined) {
                    anyArgs.data.tenantId = tenantId;
                  }
                }
              }
              args = anyArgs;
            }
            return query(args);
          },
        },
      },
    });

    return new Proxy(extendedClient as any, {
      get: (target, prop) => {
        if (prop === 'onModuleInit') return this.onModuleInit.bind(this);
        if (prop === 'onModuleDestroy') return this.onModuleDestroy.bind(this);

        const value = target[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
