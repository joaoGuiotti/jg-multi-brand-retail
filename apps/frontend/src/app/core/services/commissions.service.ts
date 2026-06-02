import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { IResponse } from '../models/response-base';

export interface CommissionMetrics {
  userId: string;
  month: number;
  year: number;
  targetAmount: number;
  totalSold: number;
  commissionEarned: number;
  progressPercentage: number;
}

export interface CommissionTransactionItem {
  id: string;
  userId: string;
  userName: string;
  saleId: string;
  baseAmount: number;
  percentageApplied: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

export interface CommissionListResult {
  data: CommissionTransactionItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root'
})
export class CommissionsService {
  private apiUrl = `${environment.apiUrl}/v1/commissions`;

  constructor(private http: HttpClient) {}

  getCommissionRate(): Observable<IResponse<{ commissionRate: number }>> {
    return this.http.get<IResponse<{ commissionRate: number }>>(`${this.apiUrl}/rate`);
  }

  updateCommissionRate(commissionRate: number): Observable<IResponse<any>> {
    return this.http.patch<IResponse<any>>(`${this.apiUrl}/rate`, { commissionRate });
  }

  setSalesTarget(userId: string, month: number, year: number, targetAmount: number): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(`${this.apiUrl}/targets`, { userId, month, year, targetAmount });
  }

  getDashboardMetrics(month: number, year: number, userId?: string): Observable<IResponse<CommissionMetrics>> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<IResponse<CommissionMetrics>>(`${this.apiUrl}/dashboard/metrics`, { params });
  }

  listCommissions(filters: { userId?: string; month?: number; year?: number; page?: number; limit?: number } = {}): Observable<IResponse<CommissionListResult>> {
    let params = new HttpParams();
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.month) params = params.set('month', filters.month.toString());
    if (filters.year) params = params.set('year', filters.year.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<IResponse<CommissionListResult>>(`${this.apiUrl}`, { params });
  }
}
