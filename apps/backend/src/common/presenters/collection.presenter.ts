import { Exclude, Expose } from "class-transformer";
import { PaginationPresenter, PaginationPresenterProps } from "./pagination.presenter";


export abstract class CollectionPresenter {
    @Exclude()
    protected paginationPresenter: PaginationPresenter;

    constructor(paginationPresenter: PaginationPresenterProps) {
        this.paginationPresenter = new PaginationPresenter(paginationPresenter);
    }

    @Expose({ name: 'meta' })
    get meta(): PaginationPresenter {
        return this.paginationPresenter;
    }

    abstract get data();
}