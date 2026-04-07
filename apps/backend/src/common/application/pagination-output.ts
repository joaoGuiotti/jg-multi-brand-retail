export type PaginationOutput<T = unknown> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export class PaginationOutputMapper {
  static toOutput<T>(
    data: T[],
    props: Omit<PaginationOutput<T>, 'data'>,
  ): PaginationOutput<T> {
    return {
      data,
      meta: props.meta,
    };
  }
}
