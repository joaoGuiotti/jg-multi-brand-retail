import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, CustomerFilter, CustomerListResponse } from '../models/customer.model';
import { IResponse } from '../models/response-base';

@Injectable({
    providedIn: 'root'
})
export class CustomersService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/customers`;

    getCustomers(page = 1, limit = 10, filter?: CustomerFilter): Observable<CustomerListResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filter?.search) {
            params = params.set('search', filter.search);
        }
        if (filter?.isActive !== undefined) {
            params = params.set('isActive', filter.isActive.toString());
        }
        if (filter?.sortBy) {
            params = params.set('sortBy', filter.sortBy);
        }
        if (filter?.sortOrder) {
            params = params.set('sortOrder', filter.sortOrder);
        }

        return this.http.get<CustomerListResponse>(this.apiUrl, { params });
    }

    getCustomer(id: string): Observable<IResponse<Customer>> {
        return this.http.get<IResponse<Customer>>(`${this.apiUrl}/${id}`);
    }

    createCustomer(customer: Partial<Customer>): Observable<IResponse<Customer>> {
        return this.http.post<IResponse<Customer>>(this.apiUrl, customer);
    }

    updateCustomer(id: string, customer: Partial<Customer>): Observable<IResponse<Customer>> {
        return this.http.patch<IResponse<Customer>>(`${this.apiUrl}/${id}`, customer);
    }

    deleteCustomer(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
