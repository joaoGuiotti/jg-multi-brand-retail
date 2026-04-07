import { Transform } from 'class-transformer';

export type PaginationPresenterProps = {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
};

export class PaginationPresenter {
  @Transform(({ value }) => parseInt(value))
  total: number;
  @Transform(({ value }) => parseInt(value))
  page: number;
  @Transform(({ value }) => parseInt(value))
  limit: number;
  @Transform(({ value }) => parseInt(value))
  totalPages: number;

  constructor(props: PaginationPresenterProps) {
    this.page = props.page;
    this.limit = props.limit;
    this.totalPages = props.totalPages;
    this.total = props.total;
  }
}
