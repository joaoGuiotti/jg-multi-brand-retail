import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoyaltyProgram } from '../models/loyalty.model';

export interface LoyaltyAccountResponse {
  id: string;
  customerId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  createdAt: string;
  transactions: {
    id: string;
    type: 'EARN' | 'REDEEM' | 'ADJUST';
    points: number;
    saleId: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}

export interface RedeemPointsRequest {
  customerId: string;
  pointsToRedeem: number;
  saleId: string;
}

export interface RedeemPointsResponse {
  pointsRedeemed: number;
  discountApplied: number;
  newBalance: number;
  saleTotal: number;
  capped: boolean;
}

export interface AdjustPointsRequest {
  customerId: string;
  points: number;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/loyalty`;

  getConfig(): Observable<LoyaltyProgram> {
    return this.http.get<{ data: LoyaltyProgram }>(`${this.apiUrl}/config`).pipe(
      map(res => res.data)
    );
  }

  saveConfig(config: LoyaltyProgram): Observable<LoyaltyProgram> {
    return this.http.put<{ data: LoyaltyProgram }>(`${this.apiUrl}/config`, config).pipe(
      map(res => res.data)
    );
  }

  getCustomerAccount(customerId: string): Observable<LoyaltyAccountResponse> {
    return this.http.get<{ data: LoyaltyAccountResponse }>(`${this.apiUrl}/account/${customerId}`).pipe(
      map(res => res.data)
    );
  }

  redeemPoints(request: RedeemPointsRequest): Observable<RedeemPointsResponse> {
    return this.http.post<{ data: RedeemPointsResponse }>(`${this.apiUrl}/redeem`, request).pipe(
      map(res => res.data)
    );
  }

  adjustPoints(request: AdjustPointsRequest): Observable<any> {
    return this.http.post<{ data: any }>(`${this.apiUrl}/adjust`, request).pipe(
      map(res => res.data)
    );
  }
}
