import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../models/response-base';
import { CreateSaleDto, Sale, SaleFilter, SaleListResponse } from '../models/sale.model';

@Injectable({
    providedIn: 'root'
})
export class SalesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/sales`;

    getSales(page = 1, limit = 10, filter?: SaleFilter): Observable<SaleListResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filter?.status) {
            params = params.set('status', filter.status);
        }
        if (filter?.startDate) {
            params = params.set('startDate', filter.startDate);
        }
        if (filter?.endDate) {
            params = params.set('endDate', filter.endDate);
        }
        if (filter?.sortBy) {
            params = params.set('sortBy', filter.sortBy);
        }
        if (filter?.sortOrder) {
            params = params.set('sortOrder', filter.sortOrder);
        }

        return this.http.get<SaleListResponse>(this.apiUrl, { params });
    }

    getSale(id: string): Observable<Sale> {
        return this.http.get<Sale>(`${this.apiUrl}/${id}`);
    }

    createSale(sale: CreateSaleDto): Observable<IResponse<Sale>> {
        return this.http.post<IResponse<Sale>>(this.apiUrl, sale);
    }

    cancelSale(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/cancel`, {});
    }
}
