export class PaginationDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
