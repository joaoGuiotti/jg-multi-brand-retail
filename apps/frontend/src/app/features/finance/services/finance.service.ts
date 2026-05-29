import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IResponse } from '@core/models/response-base';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

export interface FinancialAccount {
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

export interface CreateAccountDto {
  type: FinancialAccountType;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  saleId?: string;
}

export interface PayAccountDto {
  paidAt: string;
}

export interface CashFlowEntry {
  date: string;
  inflows: number;
  outflows: number;
  balance: number;
}

export interface CashFlowStatement {
  entries: CashFlowEntry[];
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
}

export interface DREStatement {
  grossRevenue: number;
  cmv: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/v1/finance`;

  getAccounts(filters?: { type?: FinancialAccountType; status?: FinancialAccountStatus; startDate?: string; endDate?: string }): Observable<FinancialAccount[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<IResponse<FinancialAccount[]>>(`${this.apiUrl}/accounts`, { params })
      .pipe(map((res: IResponse<FinancialAccount[]>) => res.data));
  }

  createAccount(dto: CreateAccountDto): Observable<FinancialAccount> {
    return this.http.post<IResponse<FinancialAccount>>(`${this.apiUrl}/accounts`, dto)
      .pipe(map((res: IResponse<FinancialAccount>) => res.data));
  }

  payAccount(id: string, dto: PayAccountDto): Observable<FinancialAccount> {
    return this.http.patch<IResponse<FinancialAccount>>(`${this.apiUrl}/accounts/${id}/pay`, dto)
      .pipe(map((res: IResponse<FinancialAccount>) => res.data));
  }

  getCashFlow(month: number, year: number): Observable<CashFlowStatement> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<IResponse<CashFlowStatement>>(`${this.apiUrl}/cash-flow`, { params })
      .pipe(map((res: IResponse<CashFlowStatement>) => res.data));
  }

  getDRE(month: number, year: number): Observable<DREStatement> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<IResponse<DREStatement>>(`${this.apiUrl}/dre`, { params })
      .pipe(map((res: IResponse<DREStatement>) => res.data));
  }

  downloadDREPdf(month: number, year: number): Observable<Blob> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get(`${this.apiUrl}/dre/pdf`, { params, responseType: 'blob' });
  }
}
