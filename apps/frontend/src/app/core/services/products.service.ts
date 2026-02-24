import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductCreateDto, ProductFilter, ProductUpdateDto } from '../models/product.model';
import { IResponse } from '../models/response-base';

@Injectable({
    providedIn: 'root'
})
export class ProductsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/products`;

    getProducts(page = 1, limit = 10, filter?: ProductFilter): Observable<IResponse<Product[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filter?.search) {
            params = params.set('search', filter.search);
        }
        if (filter?.categoryId) {
            params = params.set('categoryId', filter.categoryId);
        }
        if (filter?.brandId) {
            params = params.set('brandId', filter.brandId);
        }
        if (filter?.isActive !== undefined) {
            params = params.set('isActive', filter.isActive.toString());
        }
        if (filter?.lowStock) {
            params = params.set('lowStock', 'true');
        }
        if (filter?.sortBy) {
            params = params.set('sortBy', filter.sortBy);
        }
        if (filter?.sortOrder) {
            params = params.set('sortOrder', filter.sortOrder);
        }

        return this.http.get<IResponse<Product[]>>(this.apiUrl, { params });
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    createProduct(product: ProductCreateDto): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    updateProduct(id: string, product: ProductUpdateDto): Observable<Product> {
        return this.http.patch<Product>(`${this.apiUrl}/${id}`, product);
    }

    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    searchProducts(search: string): Observable<Product[]> {
        const params = new HttpParams().set('search', search);
        return this.http.get<Product[]>(`${this.apiUrl}/search`, { params });
    }
}
