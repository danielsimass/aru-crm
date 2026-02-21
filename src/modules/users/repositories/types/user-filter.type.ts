import { RoleType } from '../../enums/role.enum';

export interface UserFilter {
  isActive?: boolean;
  role?: RoleType;
  search?: string;
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
