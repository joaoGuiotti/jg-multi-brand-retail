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

    const modelsWithoutTenantId = ['Tenant'];

    // Extended client to inject multi-tenant filters and ensure RLS session settings
    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = cls?.get('tenantId');
            const role = cls?.get('role');
            const bypassRls = cls?.get('bypassRls');
            const authLookup = cls?.get('authLookup');
            const inTransaction = cls?.get('inTransaction');

            // Camada 1: Defesa em profundidade no nível da aplicação (Prisma where/data)
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

            // Camada 2: RLS Real no PostgreSQL
            // Se já estamos dentro de uma transação interativa, set_config já foi aplicado no início
            if (inTransaction) {
              return query(args);
            }

            // Se há contexto de tenant ou bypass configurado no CLS, executa dentro de transação local com set_config
            if (tenantId || bypassRls || authLookup) {
              return await extendedClient.$transaction(async (tx: any) => {
                cls?.set('inTransaction', true);
                try {
                  if (tenantId) {
                    await tx.$executeRawUnsafe(
                      `SELECT set_config('app.tenant_id', $1, true)`,
                      tenantId,
                    );
                  }
                  if (role) {
                    await tx.$executeRawUnsafe(
                      `SELECT set_config('app.current_user_role', $1, true)`,
                      role,
                    );
                  }
                  if (bypassRls) {
                    await tx.$executeRawUnsafe(
                      `SELECT set_config('app.bypass_rls', $1, true)`,
                      bypassRls,
                    );
                  }
                  if (authLookup) {
                    await tx.$executeRawUnsafe(
                      `SELECT set_config('app.auth_lookup', $1, true)`,
                      authLookup,
                    );
                  }
                  return await query(args);
                } finally {
                  cls?.set('inTransaction', false);
                }
              });
            }

            return query(args);
          },
        },
      },
    });

    return new Proxy(extendedClient, {
      get: (target, prop) => {
        if (prop === 'onModuleInit') return this.onModuleInit.bind(this);
        if (prop === 'onModuleDestroy') return this.onModuleDestroy.bind(this);
        if (prop === 'withAuthLookup') return this.withAuthLookup.bind(this);
        if (prop === 'withBypassRls') return this.withBypassRls.bind(this);

        if (prop === '$transaction') {
          return async (arg1: any, arg2?: any) => {
            if (typeof arg1 === 'function') {
              return await target.$transaction(async (tx: any) => {
                const tenantId = cls?.get('tenantId');
                const role = cls?.get('role');
                const bypassRls = cls?.get('bypassRls');
                const authLookup = cls?.get('authLookup');

                if (tenantId) {
                  await tx.$executeRawUnsafe(
                    `SELECT set_config('app.tenant_id', $1, true)`,
                    tenantId,
                  );
                }
                if (role) {
                  await tx.$executeRawUnsafe(
                    `SELECT set_config('app.current_user_role', $1, true)`,
                    role,
                  );
                }
                if (bypassRls) {
                  await tx.$executeRawUnsafe(
                    `SELECT set_config('app.bypass_rls', $1, true)`,
                    bypassRls,
                  );
                }
                if (authLookup) {
                  await tx.$executeRawUnsafe(
                    `SELECT set_config('app.auth_lookup', $1, true)`,
                    authLookup,
                  );
                }

                cls?.set('inTransaction', true);
                try {
                  return await arg1(tx);
                } finally {
                  cls?.set('inTransaction', false);
                }
              }, arg2);
            }
            return await target.$transaction(arg1, arg2);
          };
        }

        const value = target[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });
  }

  async withAuthLookup<T>(action: (tx: any) => Promise<T>): Promise<T> {
    return await (this as any).$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.bypass_rls', 'on', true)`,
      );
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.auth_lookup', 'on', true)`,
      );
      return await action(tx);
    });
  }

  async withBypassRls<T>(action: (tx: any) => Promise<T>): Promise<T> {
    return await (this as any).$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.bypass_rls', 'on', true)`,
      );
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_user_role', 'SUPER_ADMIN', true)`,
      );
      return await action(tx);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
