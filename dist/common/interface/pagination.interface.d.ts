export interface PaginationResult<T> {
    data: T[];
    total: number;
    totalPages: number;
    currentPage: number;
}
export declare function paginate<T>(model: any, page?: number, limit?: number, filter?: any, sort?: any, populate?: string | object | Array<string | object>): Promise<PaginationResult<T>>;
