import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    CreateMovementDto,
    InventoryFilter,
    InventoryListResponse,
    InventoryMovement,
    StockSummary,
} from '../models/inventory.model';
import { IResponse } from '../models/response-base';

@Injectable({
    providedIn: 'root',
})
export class InventoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/inventory`;

    getMovements(page = 1, limit = 10, filter?: InventoryFilter): Observable<InventoryListResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filter?.productId) params = params.set('productId', filter.productId);
        if (filter?.type) params = params.set('type', filter.type);
        if (filter?.startDate) params = params.set('startDate', filter.startDate);
        if (filter?.endDate) params = params.set('endDate', filter.endDate);
        if (filter?.sortBy) params = params.set('sortBy', filter.sortBy);
        if (filter?.sortOrder) params = params.set('sortOrder', filter.sortOrder);

        return this.http.get<InventoryListResponse>(`${this.apiUrl}/movements`, { params });
    }

    createMovement(dto: CreateMovementDto): Observable<IResponse<InventoryMovement>> {
        return this.http.post<IResponse<InventoryMovement>>(`${this.apiUrl}/movements`, dto);
    }

    getStockSummary(): Observable<StockSummary> {
        return this.http.get<IResponse<StockSummary>>(`${this.apiUrl}/summary`).pipe(
            map(r => r.data)
        );
    }

    getProductMovements(productId: string): Observable<InventoryListResponse> {
        return this.http.get<InventoryListResponse>(`${this.apiUrl}/product/${productId}`);
    }
}
