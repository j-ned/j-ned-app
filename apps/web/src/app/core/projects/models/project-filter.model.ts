export interface ProjectFilter {
  readonly category?: string;
  readonly featured?: boolean;
  readonly tags?: readonly string[];
}

export interface PaginationParams {
  readonly page: number;
  readonly itemsPerPage: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly totalItems: number;
  readonly currentPage: number;
  readonly totalPages: number;
}
