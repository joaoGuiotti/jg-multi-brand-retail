import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../models/response-base';
import {
  CreateReturnDto,
  ReturnOrder,
  ReturnFilter,
  ReturnListResponse,
  ApproveReturnDto,
} from '../models/return.model';

@Injectable({
  providedIn: 'root',
})
export class ReturnsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/returns`;

  getReturns(
    page = 1,
    limit = 10,
    filter?: ReturnFilter,
  ): Observable<ReturnListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    if (filter?.saleId) {
      params = params.set('saleId', filter.saleId);
    }
    if (filter?.customerId) {
      params = params.set('customerId', filter.customerId);
    }
    if (filter?.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter?.endDate) {
      params = params.set('endDate', filter.endDate);
    }

    return this.http.get<ReturnListResponse>(this.apiUrl, { params });
  }

  getReturn(id: string): Observable<IResponse<ReturnOrder>> {
    return this.http.get<IResponse<ReturnOrder>>(`${this.apiUrl}/${id}`);
  }

  createReturn(dto: CreateReturnDto): Observable<IResponse<ReturnOrder>> {
    return this.http.post<IResponse<ReturnOrder>>(this.apiUrl, dto);
  }

  updateStatus(
    id: string,
    dto: ApproveReturnDto,
  ): Observable<IResponse<ReturnOrder>> {
    return this.http.patch<IResponse<ReturnOrder>>(
      `${this.apiUrl}/${id}/status`,
      dto,
    );
  }

  processRefund(id: string): Observable<IResponse<ReturnOrder>> {
    return this.http.patch<IResponse<ReturnOrder>>(
      `${this.apiUrl}/${id}/refund`,
      {},
    );
  }
}
