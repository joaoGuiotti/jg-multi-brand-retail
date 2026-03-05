import { IResponse } from "./response-base";

export interface Address {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface Customer {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    document: string;
    address: Address;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerListResponse extends IResponse<Customer[]> {
}

export interface CustomerFilter {
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
