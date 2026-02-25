export interface AthleteFilter {
  name?: string;
  notes?: string;
  isActive?: boolean;
  minHeight?: number;
  maxHeight?: number;
  minBirthDate?: Date;
  maxBirthDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
