

export interface IResponse<T> {
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        totalPages?: number;
        total?: number;
    };
}