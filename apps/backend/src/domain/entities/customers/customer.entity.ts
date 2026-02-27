import { AggregateRoot } from "@common/domain/aggregate-root";

export interface CustomerProps {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;


}

export class Customer extends AggregateRoot {



}