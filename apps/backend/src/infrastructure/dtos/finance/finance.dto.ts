export enum FinancialAccountType {
  PAYABLE = 'PAYABLE',
  RECEIVABLE = 'RECEIVABLE',
}

export enum FinancialAccountStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class CreateAccountDto {
  type: FinancialAccountType;
  description: string;
  amount: number;
  dueDate: string; // ISO String
  category: string;
  saleId?: string;
}

export class PayAccountDto {
  paidAt: string; // ISO String
}

export class CashFlowEntryDto {
  date: string;
  inflows: number;
  outflows: number;
  balance: number;
}

export class CashFlowStatementDto {
  entries: CashFlowEntryDto[];
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
}

export class DREStatementDto {
  grossRevenue: number;
  cmv: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export class FinancialAccountDto {
  id: string;
  type: FinancialAccountType;
  description: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: FinancialAccountStatus;
  category: string;
  saleId?: string;
  createdAt: string;
  updatedAt: string;
}
