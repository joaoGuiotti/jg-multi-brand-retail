import { LoyaltyProgram } from '../../entities/loyalty/loyalty-program.entity';
import { LoyaltyAccount } from '../../entities/loyalty/loyalty-account.entity';
import { LoyaltyTransaction } from '../../entities/loyalty/loyalty-transaction.entity';

export interface LoyaltyTransactionSearchResult {
  data: LoyaltyTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class LoyaltyRepository {
  /**
   * Salva ou atualiza um programa de fidelidade do Tenant
   */
  abstract saveProgram(program: LoyaltyProgram): Promise<void>;

  /**
   * Busca as regras de fidelidade ativas de um Tenant
   */
  abstract findProgramByTenantId(
    tenantId: string,
  ): Promise<LoyaltyProgram | null>;

  /**
   * Salva ou atualiza a conta de pontos do cliente
   * Permite aceitar um objeto de transação Prisma opcional para controle ACID
   */
  abstract saveAccount(account: LoyaltyAccount, tx?: any): Promise<void>;

  /**
   * Busca a conta de pontos de um cliente do Tenant
   */
  abstract findAccountByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<LoyaltyAccount | null>;

  /**
   * Busca a conta de pontos de um cliente aplicando trava de escrita (FOR UPDATE)
   * Deve ser executado obrigatoriamente dentro de um escopo de transação Prisma (tx)
   */
  abstract findAccountByCustomerIdForUpdate(
    tenantId: string,
    customerId: string,
    tx: any,
  ): Promise<LoyaltyAccount | null>;

  /**
   * Salva uma movimentação de pontos de fidelidade no extrato imutável
   * Permite aceitar um objeto de transação Prisma opcional
   */
  abstract saveTransaction(
    transaction: LoyaltyTransaction,
    tx?: any,
  ): Promise<void>;

  /**
   * Busca o extrato de movimentações de fidelidade do cliente de forma paginada
   */
  abstract findTransactionsByAccountId(
    tenantId: string,
    accountId: string,
    page: number,
    limit: number,
  ): Promise<LoyaltyTransactionSearchResult>;

  /**
   * Busca todas as movimentações de fidelidade associadas a uma venda
   */
  abstract findTransactionsBySaleId(
    tenantId: string,
    saleId: string,
  ): Promise<LoyaltyTransaction[]>;
}
